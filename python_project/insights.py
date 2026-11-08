"""
insights.py - Statistical Analytics & Spending Insights Engine (Member 2: Analytics)
Expense Tracker with Spending Insights
Course: B.Tech CSE, 2nd Year, Group 3G
"""

import math
from datetime import datetime, date
from collections import defaultdict
from config import WARNING_PCT, ANOMALY_Z


def category_summary(expenses):
    """
    Computes total spending grouped by category.
    Returns dict sorted descending by total amount.
    """
    totals = defaultdict(float)
    for e in expenses:
        totals[e["category"]] += float(e["amount"])
    return dict(sorted(totals.items(), key=lambda item: item[1], reverse=True))


def monthly_trend(expenses):
    """
    Aggregates spending by month (YYYY-MM).
    Returns dict sorted chronologically.
    """
    monthly = defaultdict(float)
    for e in expenses:
        m = e["date"][:7]  # Extract YYYY-MM
        monthly[m] += float(e["amount"])
    return dict(sorted(monthly.items(), key=lambda item: item[0]))


def current_month(expenses):
    """
    Filters transactions belonging to the most recent month recorded.
    """
    if not expenses:
        return []
    latest_date = max(e["date"] for e in expenses)
    latest_month = latest_date[:7]
    return [e for e in expenses if e["date"].startswith(latest_month)]


def top_spends(expenses, n=5):
    """Returns top N largest individual expenses."""
    return sorted(expenses, key=lambda x: float(x["amount"]), reverse=True)[:n]


def budget_status(expenses, budgets):
    """
    Compares current month's spending against category limits.
    Returns list of dicts with spent, limit, used_pct, and status ('OK', 'Warning', 'Over').
    """
    cur_expenses = current_month(expenses)
    spent_by_cat = defaultdict(float)
    for e in cur_expenses:
        spent_by_cat[e["category"]] += float(e["amount"])

    rows = []
    for cat, limit in budgets.items():
        s = round(spent_by_cat.get(cat, 0.0), 2)
        pct = round((s / limit * 100), 1) if limit > 0 else 0.0
        if s > limit:
            status = "Over"
        elif pct >= WARNING_PCT:
            status = "Warning"
        else:
            status = "OK"

        rows.append({
            "category": cat,
            "spent": s,
            "limit": float(limit),
            "used_pct": pct,
            "status": status
        })

    # Sort descending by percentage utilized
    return sorted(rows, key=lambda x: x["used_pct"], reverse=True)


def flag_anomalies(expenses, threshold=ANOMALY_Z):
    """
    Detects unusual transactions within each category via Z-score:
        z = (x - mean) / std_dev
    Only flags records where z > threshold (default 2.0).
    Safeguards against zero standard deviation.
    """
    cat_groups = defaultdict(list)
    for e in expenses:
        cat_groups[e["category"]].append(e)

    anomalies = []
    for cat, items in cat_groups.items():
        if len(items) < 3:
            continue  # Need at least 3 samples for meaningful std dev

        amounts = [float(x["amount"]) for x in items]
        mean = sum(amounts) / len(amounts)
        variance = sum((x - mean) ** 2 for x in amounts) / (len(amounts) - 1)
        std = math.sqrt(variance)

        if std == 0:
            continue  # Avoid division by zero when amounts are identical

        for item in items:
            amt = float(item["amount"])
            z = (amt - mean) / std
            if z > threshold:
                anomalies.append({
                    "id": item["id"],
                    "date": item["date"],
                    "amount": amt,
                    "category": cat,
                    "note": item.get("note", ""),
                    "mean": round(mean, 2),
                    "std": round(std, 2),
                    "z_score": round(z, 2)
                })

    return sorted(anomalies, key=lambda x: x["z_score"], reverse=True)


def forecast_month_end(expenses, ref_date=None):
    """
    Projects total month-end expenditure using linear run-rate:
        Forecast = (spent_so_far / days_elapsed) * days_in_month
    """
    if not expenses:
        return 0.0

    cur_expenses = current_month(expenses)
    if not cur_expenses:
        return 0.0

    spent_so_far = sum(float(e["amount"]) for e in cur_expenses)
    
    if ref_date is None:
        latest_date_str = max(e["date"] for e in cur_expenses)
        ref_date = datetime.strptime(latest_date_str, "%Y-%m-%d").date()

    # Determine days in month
    year = ref_date.year
    month = ref_date.month
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    days_in_month = (next_month - date(year, month, 1)).days

    days_elapsed = max(1, ref_date.day)
    daily_rate = spent_so_far / days_elapsed
    forecast_total = round(daily_rate * days_in_month, 2)

    return forecast_total


def calculate_financial_health(expenses, budgets, forecast_total, anomalies):
    """
    Industry-grade Financial Health Score (0 - 100).
    Evaluates budget adherence, linear projection run-rate, outlier shocks, and daily pace.
    """
    total_budget = sum(float(b) for b in budgets.values())
    if total_budget == 0:
        return {
            "score": 75,
            "grade": "Good",
            "title": "Stable Setup",
            "summary": "Configure monthly budgets to enable full financial scoring.",
            "tips": ["Set category budgets to unlock detailed health analytics."]
        }

    score = 100
    tips = []

    # 1. Forecast ratio
    ratio = forecast_total / total_budget
    if ratio > 1.3:
        score -= 35
        tips.append("Projected to exceed overall monthly budget by over 30%.")
    elif ratio > 1.1:
        score -= 20
        tips.append("Spending pace is slightly higher than planned.")
    elif ratio > 0.95:
        score -= 10
    else:
        tips.append("Safe spending runway: Month-end forecast is well within limits.")

    # 2. Over budget categories
    b_status = budget_status(expenses, budgets)
    over_cats = [r["category"] for r in b_status if r["status"] == "Over"]
    if over_cats:
        score -= min(25, len(over_cats) * 12)
        tips.append(f"Over budget in {', '.join(over_cats)}.")

    # 3. Anomaly penalty
    if anomalies:
        score -= min(18, len(anomalies) * 6)
        tips.append(f"{len(anomalies)} statistical spending anomaly detected.")

    final_score = max(15, min(100, round(score)))
    grade = "Excellent" if final_score >= 85 else "Good" if final_score >= 70 else "Attention" if final_score >= 50 else "At Risk"

    return {
        "score": final_score,
        "grade": grade,
        "title": "Healthy Runway" if final_score >= 70 else "Budget Alert",
        "summary": "Fintech scoring based on variance, run-rate, and category utilization.",
        "tips": tips[:3]
    }


def detect_subscriptions(expenses):
    """
    Scans past transactions for recurring subscription patterns (consistent amounts & descriptions).
    """
    groups = defaultdict(list)
    for e in expenses:
        key = (e["category"], (e.get("note") or "").strip().lower())
        groups[key].append(e)

    detected = []
    for (cat, note), items in groups.items():
        if len(items) >= 2 and len(note) > 2:
            amounts = [float(x["amount"]) for x in items]
            if max(amounts) - min(amounts) <= 50:
                detected.append({
                    "name": items[0].get("note") or cat,
                    "category": cat,
                    "amount": round(amounts[0], 2),
                    "occurrences": len(items)
                })

    return sorted(detected, key=lambda x: x["amount"], reverse=True)

