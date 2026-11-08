/**
 * analytics_engine.c - C Analytics & Budget Health Engine Implementation (Member 2: Analytics)
 * GenZ Expense Tracker
 */

#include "analytics_engine.h"
#include <stdio.h>
#include <string.h>
#include <time.h>

void compute_category_totals(const ExpenseBook *book, double out_totals[NUM_CATEGORIES], double *out_grand_total) {
    for (int i = 0; i < NUM_CATEGORIES; i++) out_totals[i] = 0.0;
    *out_grand_total = 0.0;

    for (int i = 0; i < book->count; i++) {
        int idx = is_valid_category(book->items[i].category);
        if (idx >= 0) {
            out_totals[idx] += book->items[i].amount;
            *out_grand_total += book->items[i].amount;
        }
    }
}

int evaluate_budget_health(const ExpenseBook *book, const char *month_prefix, BudgetHealthRow out_rows[NUM_CATEGORIES]) {
    double spent[NUM_CATEGORIES] = {0.0};
    for (int i = 0; i < book->count; i++) {
        if (strncmp(book->items[i].date, month_prefix, 7) == 0) {
            int idx = is_valid_category(book->items[i].category);
            if (idx >= 0) spent[idx] += book->items[i].amount;
        }
    }

    for (int i = 0; i < NUM_CATEGORIES; i++) {
        strncpy(out_rows[i].category, CATEGORIES[i], MAX_CAT_LEN - 1);
        out_rows[i].category[MAX_CAT_LEN - 1] = '\0';
        out_rows[i].spent = spent[i];
        out_rows[i].limit = DEFAULT_BUDGETS[i];
        out_rows[i].used_pct = (DEFAULT_BUDGETS[i] > 0.0) ? (spent[i] / DEFAULT_BUDGETS[i] * 100.0) : 0.0;

        if (out_rows[i].used_pct >= 100.0) {
            strcpy(out_rows[i].status, "Over");
        } else if (out_rows[i].used_pct >= 80.0) {
            strcpy(out_rows[i].status, "Warning");
        } else {
            strcpy(out_rows[i].status, "OK");
        }
    }
    return NUM_CATEGORIES;
}

double compute_run_rate_forecast(const ExpenseBook *book, const char *month_prefix, int current_day, int days_in_month) {
    if (current_day <= 0) current_day = 1;
    double spent = 0.0;
    for (int i = 0; i < book->count; i++) {
        if (strncmp(book->items[i].date, month_prefix, 7) == 0) {
            spent += book->items[i].amount;
        }
    }
    double daily_pace = spent / (double)current_day;
    return daily_pace * (double)days_in_month;
}

void render_category_report(const ExpenseBook *book) {
    double totals[NUM_CATEGORIES];
    double grand_total = 0.0;
    compute_category_totals(book, totals, &grand_total);

    printf("\n=======================================================\n");
    printf("         GENZ EXPENSE - CATEGORY SPENDING (C ENGINE)   \n");
    printf("=======================================================\n");
    printf("%-16s %12s %10s   %s\n", "Category", "Spent (INR)", "Share", "Distribution");
    printf("-------------------------------------------------------\n");

    for (int i = 0; i < NUM_CATEGORIES; i++) {
        double pct = (grand_total > 0.0) ? (totals[i] / grand_total * 100.0) : 0.0;
        int bar_len = (int)(pct / 3.0);
        char bar[40] = "";
        for (int b = 0; b < bar_len && b < 30; b++) strcat(bar, "#");
        printf("%-16s Rs.%10.2f %9.1f%%   %s\n", CATEGORIES[i], totals[i], pct, bar);
    }
    printf("-------------------------------------------------------\n");
    printf("%-16s Rs.%10.2f\n", "TOTAL SPENT", grand_total);
    printf("=======================================================\n");
}

void render_budget_health_report(const ExpenseBook *book) {
    time_t t = time(NULL);
    struct tm *tm_info = localtime(&t);
    char prefix[8];
    strftime(prefix, sizeof(prefix), "%Y-%m", tm_info);

    BudgetHealthRow rows[NUM_CATEGORIES];
    evaluate_budget_health(book, prefix, rows);

    printf("\n====================================================================\n");
    printf("           BUDGET HEALTH (CURRENT MONTH: %s)                        \n", prefix);
    printf("====================================================================\n");
    printf("%-15s %12s %12s %8s   %-18s\n", "Category", "Spent (INR)", "Limit (INR)", "Used %", "Status");
    printf("--------------------------------------------------------------------\n");

    for (int i = 0; i < NUM_CATEGORIES; i++) {
        const char *tag = "[OK]";
        if (strcmp(rows[i].status, "Over") == 0) tag = "[OVER BUDGET !]";
        else if (strcmp(rows[i].status, "Warning") == 0) tag = "[WARNING 80%+]";

        printf("%-15s Rs.%9.2f  Rs.%9.2f %7.1f%%   %-18s\n",
               rows[i].category, rows[i].spent, rows[i].limit, rows[i].used_pct, tag);
    }
    printf("====================================================================\n");
}

void render_forecast_report(const ExpenseBook *book) {
    time_t t = time(NULL);
    struct tm *tm_info = localtime(&t);
    char prefix[8];
    strftime(prefix, sizeof(prefix), "%Y-%m", tm_info);

    int day = tm_info->tm_mday;
    if (day < 1) day = 1;
    int month = tm_info->tm_mon + 1;
    int year = tm_info->tm_year + 1900;
    int days_in_month = 31;
    if (month == 4 || month == 6 || month == 9 || month == 11) days_in_month = 30;
    else if (month == 2) {
        days_in_month = ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) ? 29 : 28;
    }

    double forecast = compute_run_rate_forecast(book, prefix, day, days_in_month);
    printf("\n--- MONTH-END RUN-RATE FORECAST (C ENGINE) ---\n");
    printf("  Evaluation Month:       %s\n", prefix);
    printf("  Day of Month:           Day %d of %d\n", day, days_in_month);
    printf("  Projected Total Spent:  Rs. %.2f\n", forecast);
    printf("  Mathematical Model:     (Month Spent / Day Elapsed) * Days in Month\n");
    printf("----------------------------------------------\n");
}
