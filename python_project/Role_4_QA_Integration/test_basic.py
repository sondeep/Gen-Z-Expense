"""
test_basic.py - Automated Unit Test Suite (Member 4: QA & Integration)
Expense Tracker with Spending Insights
Course: B.Tech CSE, 2nd Year, Group 3G
"""

import unittest
import os
import sys
import tempfile
from datetime import date

# Ensure modules from parent and role directories can be imported seamlessly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
for r in ["Role_1_Backend_Data", "Role_2_Analytics_Engine", "Role_3_Frontend_UI"]:
    r_path = os.path.join(BASE_DIR, r)
    if r_path not in sys.path:
        sys.path.insert(0, r_path)

from database import init_db, add_expense, clear_expenses, get_expenses, get_budgets, export_csv, import_csv
from insights import category_summary, budget_status, flag_anomalies, forecast_month_end


class TestExpenseTracker(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        clear_expenses()

    def test_negative_amount_rejected(self):
        """TC-02: Negative expense amounts must raise ValueError."""
        with self.assertRaises(ValueError):
            add_expense("2026-11-01", -50.0, "Food")

    def test_zero_amount_rejected(self):
        """TC-03: Zero amount expense must raise ValueError."""
        with self.assertRaises(ValueError):
            add_expense("2026-11-01", 0.0, "Food")

    def test_unknown_category_rejected(self):
        """TC-04: Unregistered categories (e.g. 'Gold') must be rejected."""
        with self.assertRaises(ValueError):
            add_expense("2026-11-01", 250.0, "Gold")

    def test_invalid_date_format_rejected(self):
        """TC-05: Non-ISO or malformed dates must raise ValueError."""
        with self.assertRaises(ValueError):
            add_expense("31-31-2026", 100.0, "Food")

    def test_valid_expense_added(self):
        """TC-01: Valid expense persists and returns primary key."""
        exp_id = add_expense("2026-11-01", 250.0, "Food", "Canteen lunch", "UPI")
        self.assertIsInstance(exp_id, int)
        expenses = get_expenses()
        self.assertEqual(len(expenses), 1)
        self.assertEqual(expenses[0]["amount"], 250.0)
        self.assertEqual(expenses[0]["category"], "Food")

    def test_category_summary(self):
        """Test aggregation across multiple entries of same category."""
        add_expense("2026-11-01", 100.0, "Food")
        add_expense("2026-11-02", 50.0, "Food")
        add_expense("2026-11-03", 200.0, "Transport")
        summary = category_summary(get_expenses())
        self.assertEqual(summary["Food"], 150.0)
        self.assertEqual(summary["Transport"], 200.0)

    def test_budget_status_thresholds(self):
        """Test OK, Warning, and Over budget classifications."""
        # Food: 4000 / 6000 = 66.7% -> OK
        add_expense("2026-11-01", 4000.0, "Food")
        # Transport: 2100 / 2500 = 84% -> Warning (>= 80%)
        add_expense("2026-11-02", 2100.0, "Transport")
        # Shopping: 3500 / 3000 = 116.7% -> Over (> 100%)
        add_expense("2026-11-03", 3500.0, "Shopping")

        budgets = {"Food": 6000, "Transport": 2500, "Shopping": 3000}
        statuses = {s["category"]: s["status"] for s in budget_status(get_expenses(), budgets)}
        self.assertEqual(statuses["Food"], "OK")
        self.assertEqual(statuses["Transport"], "Warning")
        self.assertEqual(statuses["Shopping"], "Over")

    def test_anomaly_detection(self):
        """Test Z-score outlier flagging (> 2.0 std dev within category)."""
        # Baseline food items between 80 and 150
        for i in range(1, 11):
            add_expense(f"2026-11-{i:02d}", 100.0 + i * 5, "Food")
        # Outlier
        add_expense("2026-11-12", 4800.0, "Food", "Expensive treat")

        anomalies = flag_anomalies(get_expenses(), threshold=2.0)
        self.assertEqual(len(anomalies), 1)
        self.assertEqual(anomalies[0]["amount"], 4800.0)
        self.assertGreater(anomalies[0]["z_score"], 2.0)

    def test_forecast_projection(self):
        """Test run-rate month-end forecast calculation."""
        # 500 spent on day 5 of a 30-day month -> 500 / 5 * 30 = 3000
        add_expense("2026-11-05", 500.0, "Food")
        ref_day = date(2026, 11, 5)
        proj = forecast_month_end(get_expenses(), ref_date=ref_day)
        self.assertEqual(proj, 3000.0)

    def test_csv_roundtrip(self):
        """Test CSV export and import integrity."""
        add_expense("2026-11-01", 250.0, "Food", "Burger", "Card")
        add_expense("2026-11-02", 120.0, "Transport", "Bus pass", "UPI")

        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            exported = export_csv(tmp_path)
            self.assertEqual(exported, 2)
            clear_expenses()
            self.assertEqual(len(get_expenses()), 0)
            imported, errors = import_csv(tmp_path)
            self.assertEqual(imported, 2)
            self.assertEqual(len(errors), 0)
            self.assertEqual(len(get_expenses()), 2)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_bank_sms_ingestion(self):
        """TC-11: Bank & UPI SMS parsing extracts amount, merchant and predicts category."""
        from sms_parser import parse_bank_sms, ingest_sms_to_db

        sms = "Sent Rs. 350.00 from Kotak Bank AC X1234 to swiggy@icici on 08-11-2026 Ref 431289123891."
        parsed = parse_bank_sms(sms)
        self.assertEqual(parsed["amount"], 350.0)
        self.assertEqual(parsed["category"], "Food")
        self.assertEqual(parsed["payment_mode"], "UPI")

        # Test database ingestion
        res = ingest_sms_to_db(sms)
        self.assertIn("id", res)
        expenses = get_expenses()
        self.assertTrue(any(e["amount"] == 350.0 and e["category"] == "Food" for e in expenses))

    def test_financial_health_scoring(self):
        """Test financial health score computation."""
        from insights import calculate_financial_health
        add_expense("2026-11-01", 1000.0, "Food")
        budgets = {"Food": 6000.0, "Rent": 9000.0}
        health = calculate_financial_health(get_expenses(), budgets, 6000.0, [])
        self.assertGreaterEqual(health["score"], 70)
        self.assertIn(health["grade"], ["Excellent", "Good"])

    def test_subscription_detection(self):
        """Test recurring subscription detection from identical historical entries."""
        from insights import detect_subscriptions
        add_expense("2026-10-08", 649.0, "Entertainment", "Netflix")
        add_expense("2026-11-08", 649.0, "Entertainment", "Netflix")
        detected = detect_subscriptions(get_expenses())
        self.assertEqual(len(detected), 1)
        self.assertEqual(detected[0]["name"], "Netflix")

    def test_batch_sms_parsing(self):
        """Test multi-message SMS parsing."""
        from sms_parser import parse_batch_bank_sms
        batch = """
Sent Rs. 350.00 from Kotak Bank AC X1234 to swiggy@icici on 08-11-2026 Ref 431289123891.

HDFC Bank: Rs 2,850.00 debited from a/c **4321 on 07-11-26 to RELIANCE RETAIL. Avl bal: Rs 45,210.
"""
        valid, failed = parse_batch_bank_sms(batch)
        self.assertEqual(len(valid), 2)
        self.assertEqual(failed, 0)
        self.assertEqual(valid[0]["amount"], 350.0)
        self.assertEqual(valid[1]["amount"], 2850.0)


if __name__ == "__main__":
    unittest.main()

