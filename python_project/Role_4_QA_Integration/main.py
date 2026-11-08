"""
main.py - CLI Fallback & Integration Controller (Member 4: QA & Integration)
Expense Tracker with Spending Insights
Course: B.Tech CSE, 2nd Year, Group 3G
"""

import sys
import os
import argparse
from datetime import date

# Ensure modules from parent and role directories can be imported seamlessly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
for r in ["Role_1_Backend_Data", "Role_2_Analytics_Engine", "Role_3_Frontend_UI"]:
    r_path = os.path.join(BASE_DIR, r)
    if r_path not in sys.path:
        sys.path.insert(0, r_path)

from database import init_db, add_expense, get_expenses, get_budgets, seed_sample_data, delete_expense
from insights import (
    category_summary,
    monthly_trend,
    budget_status,
    flag_anomalies,
    forecast_month_end,
    top_spends
)
from sms_parser import parse_bank_sms, ingest_sms_to_db, SAMPLE_BANK_SMS


def print_banner():
    print("=" * 65)
    print("  EXPENSE TRACKER WITH SPENDING INSIGHTS (CLI FALLBACK)")
    print("  Industry Readiness Programme I - Group 3G")
    print("  Stack: Python 3, SQLite, C++ Engine & Automated SMS Ingestion")
    print("=" * 65)


def display_summary():
    expenses = get_expenses()
    if not expenses:
        print("\nNo expenses found. Seed sample data or add an expense.")
        return
    summary = category_summary(expenses)
    print("\n--- SPENDING BY CATEGORY ---")
    total = sum(summary.values())
    for cat, amt in summary.items():
        pct = (amt / total * 100) if total > 0 else 0
        bar = "■" * int(pct / 4)
        print(f"  {cat:<15} ₹{amt:>10,.2f}  ({pct:>5.1f}%)  {bar}")
    print(f"  {'-' * 45}")
    print(f"  {'TOTAL':<15} ₹{total:>10,.2f}")


def display_budget_status():
    expenses = get_expenses()
    budgets = get_budgets()
    rows = budget_status(expenses, budgets)
    print("\n--- BUDGET STATUS (CURRENT MONTH) ---")
    print(f"  {'Category':<15} {'Spent (INR)':<14} {'Limit (INR)':<14} {'Used %':<10} {'Alert Status'}")
    print(f"  {'-' * 65}")
    for r in rows:
        status_tag = f"[{r['status']}]"
        if r['status'] == "Over":
            status_tag = "[OVER BUDGET ⚠️]"
        elif r['status'] == "Warning":
            status_tag = "[WARNING 80%+]"
        print(f"  {r['category']:<15} ₹{r['spent']:>10,.2f}   ₹{r['limit']:>10,.2f}   {r['used_pct']:>6.1f}%    {status_tag}")


def display_anomalies():
    expenses = get_expenses()
    anomalies = flag_anomalies(expenses)
    print("\n--- DETECTED ANOMALIES (Z-SCORE > 2.0) ---")
    if not anomalies:
        print("  No statistical anomalies detected. Spending velocity normal.")
        return
    print(f"  {'Date':<12} {'Category':<14} {'Amount (INR)':<14} {'Z-Score':<10} {'Note'}")
    print(f"  {'-' * 65}")
    for a in anomalies:
        print(f"  {a['date']:<12} {a['category']:<14} ₹{a['amount']:>10,.2f}   {a['z_score']:>6.2f}σ   {a['note']}")


def display_forecast():
    expenses = get_expenses()
    forecast = forecast_month_end(expenses)
    print("\n--- MONTH-END RUN-RATE FORECAST ---")
    print(f"  Projected Month-End Total: ₹{forecast:,.2f}")
    print("  Model: Linear run-rate = (Month spent so far / Days elapsed) * Days in month")


def parse_and_ingest_sms_cli(sms_text):
    print("\n--- BANK SMS INGESTION ENGINE ---")
    try:
        res = ingest_sms_to_db(sms_text)
        print(f"✓ SMS successfully parsed and persisted to SQLite (ID #{res['id']}):")
        print(f"  Bank:         {res['bank']}")
        print(f"  Amount:       ₹{res['amount']:,.2f}")
        print(f"  Category:     {res['category']} (Confidence: {res['confidence']}%)")
        print(f"  Merchant:     {res['merchant']}")
        print(f"  Payment Mode: {res['payment_mode']}")
        print(f"  Date:         {res['date']}")
        print(f"  Ref / UTR:    {res['ref_no'] or 'N/A'}")
    except Exception as e:
        print(f"❌ Failed to parse SMS: {e}")


def interactive_menu():
    init_db()
    while True:
        print_banner()
        print("  [1] View Category Spending Breakdown")
        print("  [2] View Current Month Budget vs Actual Status")
        print("  [3] Detect Statistical Anomalies (Z-Score > 2.0)")
        print("  [4] Run Month-End Forecast Projection")
        print("  [5] Record New Expense Manually (Add)")
        print("  [6] Ingest Bank / UPI Transaction via SMS Text")
        print("  [7] View Top 5 Largest Spends")
        print("  [8] Seed 90 Days Realistic Sample Data")
        print("  [9] Exit")
        print("=" * 65)
        choice = input("Select an option [1-9]: ").strip()

        if choice == "1":
            display_summary()
        elif choice == "2":
            display_budget_status()
        elif choice == "3":
            display_anomalies()
        elif choice == "4":
            display_forecast()
        elif choice == "5":
            try:
                day = input("Date (YYYY-MM-DD) [Default: Today]: ").strip() or date.today().strftime("%Y-%m-%d")
                amt = float(input("Amount in INR: ").strip())
                cat = input("Category (Food/Transport/Rent/Shopping/Bills/Health/Entertainment/Other): ").strip()
                note = input("Note (optional): ").strip()
                mode = input("Payment Mode (UPI/Card/Cash/Net Banking) [Default: UPI]: ").strip() or "UPI"
                new_id = add_expense(day, amt, cat, note, mode)
                print(f"✓ Expense successfully saved with ID #{new_id}")
            except Exception as e:
                print(f"❌ Error adding expense: {e}")
        elif choice == "6":
            print("\nSelect a sample SMS or type/paste your bank SMS:")
            print("  [0] Paste custom SMS")
            for i, s in enumerate(SAMPLE_BANK_SMS[:5], 1):
                print(f"  [{i}] {s['bank']} - \"{s['text'][:55]}...\"")
            sms_choice = input("Option [0-5]: ").strip()
            if sms_choice == "0":
                custom = input("Paste Bank SMS: ").strip()
                if custom:
                    parse_and_ingest_sms_cli(custom)
            elif sms_choice.isdigit() and 1 <= int(sms_choice) <= len(SAMPLE_BANK_SMS):
                idx = int(sms_choice) - 1
                parse_and_ingest_sms_cli(SAMPLE_BANK_SMS[idx]["text"])
            else:
                print("Invalid choice.")
        elif choice == "7":
            spends = top_spends(get_expenses(), 5)
            print("\n--- TOP 5 EXPENSES ---")
            for i, s in enumerate(spends, 1):
                print(f"  {i}. {s['date']} | {s['category']:<12} | ₹{s['amount']:>8,.2f} | {s['note']}")
        elif choice == "8":
            count = seed_sample_data(90)
            print(f"✓ Seeded {count} sample transactions successfully.")
        elif choice == "9":
            print("\nExiting CLI. Have a productive day!\n")
            break
        else:
            print("Invalid selection.")
        input("\nPress Enter to continue...")


if __name__ == "__main__":
    init_db()
    parser = argparse.ArgumentParser(description="Expense Tracker CLI (Member 4 Integration)")
    parser.add_argument("--summary", action="store_true", help="Print category summary")
    parser.add_argument("--budget", action="store_true", help="Print budget vs actual")
    parser.add_argument("--anomalies", action="store_true", help="Print Z-score anomalies")
    parser.add_argument("--forecast", action="store_true", help="Print month-end forecast")
    parser.add_argument("--seed", action="store_true", help="Seed 90 days of sample transactions")
    parser.add_argument("--parse-sms", type=str, help="Ingest a bank SMS string")
    parser.add_argument("--interactive", action="store_true", help="Launch interactive terminal menu")

    args = parser.parse_args()

    if args.parse_sms:
        parse_and_ingest_sms_cli(args.parse_sms)
    elif args.seed:
        count = seed_sample_data(90)
        print(f"Database seeded with {count} sample records.")
    elif args.summary:
        display_summary()
    elif args.budget:
        display_budget_status()
    elif args.anomalies:
        display_anomalies()
    elif args.forecast:
        display_forecast()
    elif args.interactive or len(sys.argv) == 1:
        print_banner()
        display_summary()
        display_budget_status()
        display_anomalies()
        display_forecast()
