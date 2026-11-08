"""
app.py - Streamlit Frontend Dashboard (Member 3: Frontend)
Expense Tracker with Spending Insights
Course: B.Tech CSE, 2nd Year, Group 3G
"""

import streamlit as st
from datetime import date
from config import CATEGORIES, PAYMENT_MODES
from database import init_db, add_expense, get_expenses, get_budgets
from insights import (
    category_summary,
    budget_status,
    flag_anomalies,
    forecast_month_end,
    top_spends,
    current_month
)
from charts import pie_by_category, bar_monthly

# Configure page layout
st.set_page_config(
    page_title="Expense Tracker with Spending Insights",
    page_icon="💰",
    layout="wide"
)

# Initialize database
init_db()

st.title("Expense Tracker with Spending Insights")
st.markdown("**Industry Readiness Programme I** · *Course: B.Tech CSE, 2nd Year, Group 3G*")

# Sidebar: Transaction Input Form
with st.sidebar.form("add_expense_form"):
    st.header("Add Expense")
    d = st.date_input("Date", date.today())
    amount = st.number_input("Amount (INR)", min_value=0.0, step=50.0)
    category = st.selectbox("Category", CATEGORIES)
    note = st.text_input("Note (optional)")
    mode = st.selectbox("Payment Mode", PAYMENT_MODES)

    submitted = st.form_submit_button("Save Expense")
    if submitted:
        try:
            exp_id = add_expense(d, amount, category, note, mode)
            st.success(f"Saved successfully (ID #{exp_id})")
        except ValueError as e:
            st.error(str(e))

# Main Dashboard
expenses = get_expenses()
if not expenses:
    st.info("No expenses found. Add your first transaction from the sidebar.")
    st.stop()

# Key Financial Metrics
col1, col2, col3 = st.columns(3)
total_spent = sum(float(e["amount"]) for e in expenses)
cur_spent = sum(float(e["amount"]) for e in current_month(expenses))
forecast = forecast_month_end(expenses)

col1.metric("Lifetime Total Spent", f"₹{total_spent:,.2f}")
col2.metric("Current Month Spend", f"₹{cur_spent:,.2f}")
col3.metric("Month-End Forecast", f"₹{forecast:,.2f}")

st.markdown("---")

# Budget Status with Visual Progress
st.subheader("Monthly Budget Utilization")
budgets = get_budgets()
status_rows = budget_status(expenses, budgets)

for r in status_rows:
    col_a, col_b = st.columns([1, 4])
    with col_a:
        st.write(f"**{r['category']}**: ₹{r['spent']:,.0f} / ₹{r['limit']:,.0f}")
        if r['status'] == 'Over':
            st.error("Over Budget")
        elif r['status'] == 'Warning':
            st.warning("Warning (>=80%)")
        else:
            st.success("OK")
    with col_b:
        progress_val = min(1.0, r["used_pct"] / 100.0)
        st.progress(progress_val)

st.markdown("---")

# Charts: Category Pie & Monthly Trends
chart_left, chart_right = st.columns(2)
with chart_left:
    st.pyplot(pie_by_category(expenses))
with chart_right:
    st.pyplot(bar_monthly(expenses))

# Anomaly Alerts & Top Spends
st.markdown("---")
anom_col, top_col = st.columns(2)

with anom_col:
    st.subheader("Statistical Anomalies (Z-Score > 2.0)")
    anomalies = flag_anomalies(expenses)
    if anomalies:
        st.dataframe(anomalies, use_container_width=True)
    else:
        st.caption("No anomalies detected in current dataset.")

with top_col:
    st.subheader("Top 5 Spends")
    st.dataframe(top_spends(expenses, 5), use_container_width=True)
