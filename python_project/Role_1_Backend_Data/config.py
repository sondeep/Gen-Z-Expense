"""
config.py - Central Configuration Module (Member 1: Backend Data Layer)
Expense Tracker with Spending Insights
Course: B.Tech CSE, 2nd Year, Group 3G
"""

# Allowed expense categories
CATEGORIES = [
    "Food",
    "Transport",
    "Rent",
    "Shopping",
    "Bills",
    "Health",
    "Entertainment",
    "Other"
]

# Accepted payment modes
PAYMENT_MODES = [
    "UPI",
    "Card",
    "Cash",
    "Net Banking"
]

# Monthly budget limits per category (in INR)
DEFAULT_BUDGETS = {
    "Food": 6000,
    "Transport": 2500,
    "Shopping": 3000,
    "Entertainment": 2000,
    "Bills": 2500,
    "Health": 2000,
    "Rent": 9000,
    "Other": 1500
}

# Alert thresholds
WARNING_PCT = 80   # Budget usage at or above this percentage shows Warning
ANOMALY_Z = 2.0    # Z-score threshold for intra-category outlier detection
