/**
 * analytics_engine.h - C Analytics & Budget Health Engine (Member 2: Analytics)
 * GenZ Expense Tracker
 */

#ifndef ANALYTICS_ENGINE_H
#define ANALYTICS_ENGINE_H

#include "../Role_1_Backend_Data/data_layer.h"

typedef struct {
    char category[MAX_CAT_LEN];
    double spent;
    double limit;
    double used_pct;
    char status[20]; // "OK", "Warning", "Over"
} BudgetHealthRow;

// Aggregate spending by category
void compute_category_totals(const ExpenseBook *book, double out_totals[NUM_CATEGORIES], double *out_grand_total);

// Budget health evaluations
int evaluate_budget_health(const ExpenseBook *book, const char *month_prefix, BudgetHealthRow out_rows[NUM_CATEGORIES]);

// Month-end linear run-rate projection formula: (spent_so_far / day_of_month) * days_in_month
double compute_run_rate_forecast(const ExpenseBook *book, const char *month_prefix, int current_day, int days_in_month);

// Formatted ASCII reports
void render_category_report(const ExpenseBook *book);
void render_budget_health_report(const ExpenseBook *book);
void render_forecast_report(const ExpenseBook *book);

#endif // ANALYTICS_ENGINE_H
