"""
database.py - SQLite Database Management & Data Layer (Member 1: Backend Data Layer)
Expense Tracker with Spending Insights
Course: B.Tech CSE, 2nd Year, Group 3G
"""

import sqlite3
import random
import csv
import os
from datetime import date, datetime, timedelta
from config import CATEGORIES, PAYMENT_MODES, DEFAULT_BUDGETS

DB_FILE = os.path.join(os.path.dirname(__file__), "expenses.db")


def conn():
    """Establish and return a connection to the SQLite database."""
    c = sqlite3.connect(DB_FILE)
    c.row_factory = sqlite3.Row
    return c


def init_db():
    """Initialize database tables with strict schema constraints."""
    with conn() as c:
        # Expenses table with CHECK constraints
        c.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                amount REAL NOT NULL CHECK(amount > 0),
                category TEXT NOT NULL,
                note TEXT,
                payment_mode TEXT
            )
        """)
        # Budgets table
        c.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                category TEXT PRIMARY KEY,
                monthly_limit REAL NOT NULL CHECK(monthly_limit > 0)
            )
        """)
        # Populate default budgets if empty
        existing = c.execute("SELECT count(*) as cnt FROM budgets").fetchone()["cnt"]
        if existing == 0:
            for cat, limit in DEFAULT_BUDGETS.items():
                c.execute("INSERT INTO budgets (category, monthly_limit) VALUES (?, ?)", (cat, float(limit)))


def validate_expense(day, amount, category, mode="UPI"):
    """Validates expense attributes before persistence."""
    if amount is None or amount <= 0:
        raise ValueError("Amount must be positive")
    
    if category not in CATEGORIES:
        raise ValueError(f"Unknown category: {category}. Allowed: {CATEGORIES}")
    
    if mode not in PAYMENT_MODES:
        raise ValueError(f"Unknown payment mode: {mode}. Allowed: {PAYMENT_MODES}")

    # Validate ISO date format YYYY-MM-DD
    if isinstance(day, str):
        try:
            parsed = datetime.strptime(day, "%Y-%m-%d").date()
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid date format: {day}. Expected YYYY-MM-DD")
    elif isinstance(day, (date, datetime)):
        return day.strftime("%Y-%m-%d")
    else:
        raise ValueError(f"Unsupported date type: {type(day)}")


def add_expense(day, amount, category, note="", mode="UPI"):
    """
    Validates and persists an expense record using parameterized queries.
    Prevents SQL injection vulnerabilities.
    """
    clean_date = validate_expense(day, float(amount), category, mode)
    with conn() as c:
        cursor = c.execute(
            "INSERT INTO expenses (date, amount, category, note, payment_mode) VALUES (?, ?, ?, ?, ?)",
            (clean_date, float(amount), category, note.strip() if note else "", mode)
        )
        return cursor.lastrowid


def get_expenses(start=None, end=None):
    """
    Fetch all expenses or filter by date range.
    Returns list of dict-like records.
    """
    query = "SELECT id, date, amount, category, note, payment_mode FROM expenses"
    params = []
    clauses = []
    if start:
        clauses.append("date >= ?")
        params.append(start)
    if end:
        clauses.append("date <= ?")
        params.append(end)
    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY date DESC, id DESC"

    with conn() as c:
        rows = c.execute(query, params).fetchall()
        return [dict(r) for r in rows]


def delete_expense(expense_id):
    """Deletes an expense row by primary key."""
    with conn() as c:
        cursor = c.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
        return cursor.rowcount > 0


def set_budget(category, limit):
    """Inserts or updates the monthly budget ceiling for a category."""
    if limit <= 0:
        raise ValueError("Budget limit must be greater than 0")
    with conn() as c:
        c.execute("INSERT OR REPLACE INTO budgets (category, monthly_limit) VALUES (?, ?)",
                  (category, float(limit)))


def get_budgets():
    """Returns mapping of category name to monthly limit amount."""
    with conn() as c:
        rows = c.execute("SELECT category, monthly_limit FROM budgets").fetchall()
        return {r["category"]: float(r["monthly_limit"]) for r in rows}


def clear_expenses():
    """Removes all expense records (useful for testing and reset)."""
    with conn() as c:
        c.execute("DELETE FROM expenses")


def seed_sample_data(days=90):
    """
    Generates realistic 3-6 month sample transactions with deterministic seed
    to guarantee meaningful charts in live demonstrations.
    """
    clear_expenses()
    random.seed(42)
    ranges = {
        "Food": (80, 450),
        "Transport": (30, 300),
        "Shopping": (300, 3000),
        "Bills": (200, 1500),
        "Entertainment": (150, 1200),
        "Health": (100, 1500),
        "Other": (50, 400)
    }
    today = date.today()
    added_count = 0

    for i in range(days):
        d = today - timedelta(days=i)
        iso_str = d.strftime("%Y-%m-%d")

        # Rent on 1st of month
        if d.day == 1:
            add_expense(iso_str, 9000, "Rent", "Monthly hostel/flat rent", "Net Banking")
            added_count += 1

        # 1 to 3 random transactions
        num_spends = random.randint(1, 3)
        sample_cats = random.sample(list(ranges.keys()), num_spends)
        for cat in sample_cats:
            lo, hi = ranges[cat]
            amt = random.randint(lo, hi)
            mode = random.choice(PAYMENT_MODES)
            add_expense(iso_str, amt, cat, f"{cat} expense", mode)
            added_count += 1

    # Inject deliberate anomaly in recent transactions for Member 2 Z-score detection demo
    recent_day = (today - timedelta(days=2)).strftime("%Y-%m-%d")
    add_expense(recent_day, 4800, "Food", "Fine dining group treat (Deliberate Anomaly)", "Card")
    added_count += 1

    return added_count


def export_csv(filepath):
    """Exports all expenses to CSV format."""
    expenses = get_expenses()
    with open(filepath, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "date", "amount", "category", "note", "payment_mode"])
        for e in expenses:
            writer.writerow([e["id"], e["date"], e["amount"], e["category"], e["note"], e["payment_mode"]])
    return len(expenses)


def import_csv(filepath):
    """
    Imports transactions from CSV with row-by-row validation.
    Reports bad rows while preserving valid entries.
    """
    imported = 0
    errors = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=2):
            try:
                date_val = row["date"].strip()
                amt_val = float(row["amount"].strip())
                cat_val = row["category"].strip()
                note_val = row.get("note", "").strip()
                mode_val = row.get("payment_mode", "UPI").strip()
                add_expense(date_val, amt_val, cat_val, note_val, mode_val)
                imported += 1
            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")
    return imported, errors


if __name__ == "__main__":
    init_db()
    count = seed_sample_data(90)
    print(f"Database initialized and seeded with {count} sample records.")
