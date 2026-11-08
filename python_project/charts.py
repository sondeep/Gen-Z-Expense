"""
charts.py - Matplotlib Data Visualizations (Member 3: Frontend Visuals)
Expense Tracker with Spending Insights
Course: B.Tech CSE, 2nd Year, Group 3G
"""

import matplotlib.pyplot as plt
from insights import category_summary, monthly_trend


def pie_by_category(expenses):
    """Generates Matplotlib pie chart of spending distribution by category."""
    summary = category_summary(expenses)
    categories = list(summary.keys())
    values = list(summary.values())

    fig, ax = plt.subplots(figsize=(6, 5), facecolor="#ffffff")
    if not values or sum(values) == 0:
        ax.text(0.5, 0.5, "No Data", ha="center", va="center")
        return fig

    colors = ["#ff7a45", "#17b8a6", "#8f77ff", "#e0b100", "#ff6fa5", "#4f8cff", "#10b981", "#64748b"]
    ax.pie(
        values,
        labels=categories,
        autopct="%1.0f%%",
        startangle=90,
        colors=colors[:len(categories)],
        textprops={"fontsize": 9, "color": "#1e293b"}
    )
    ax.set_title("Spending Breakdown by Category", fontsize=12, fontweight="bold", pad=12, color="#0f172a")
    plt.tight_layout()
    return fig


def bar_monthly(expenses):
    """Generates Matplotlib bar chart of monthly spending trend."""
    trend = monthly_trend(expenses)
    months = list(trend.keys())
    values = list(trend.values())

    fig, ax = plt.subplots(figsize=(7, 4.5), facecolor="#ffffff")
    if not months:
        ax.text(0.5, 0.5, "No Data", ha="center", va="center")
        return fig

    bars = ax.bar(months, values, color="#6366f1", width=0.55, edgecolor="#4338ca", linewidth=1.2)
    ax.set_title("Monthly Spending Trend", fontsize=12, fontweight="bold", pad=12, color="#0f172a")
    ax.set_ylabel("Total Spent (INR)", fontsize=10, fontweight="semibold", color="#334155")
    ax.grid(axis="y", linestyle="--", alpha=0.5)
    ax.set_axisbelow(True)

    # Add value annotations on top of each bar
    for bar in bars:
        height = bar.get_height()
        ax.annotate(
            f"₹{int(height):,}",
            xy=(bar.get_x() + bar.get_width() / 2, height),
            xytext=(0, 4),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=8,
            fontweight="bold",
            color="#1e293b"
        )

    plt.xticks(rotation=30, ha="right", fontsize=9)
    plt.tight_layout()
    return fig
