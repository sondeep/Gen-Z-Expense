/**
 * expense_tracker.c - GenZ Expense Tracker in Pure ANSI C (C99/C11)
 *
 * Features:
 * - In-memory dynamic array with file persistence (CSV)
 * - Strict input validation: rejection of negative amounts, zero amounts, and invalid categories
 * - Category spending aggregation
 * - Monthly budget status calculation (OK, Warning >=80%, Over >100%)
 * - Daily pace and month-end run-rate forecasting
 * - Interactive CLI menu
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <ctype.h>

#define MAX_EXPENSES 1000
#define MAX_NOTE_LEN 100
#define MAX_DATE_LEN 11
#define MAX_CAT_LEN 30
#define MAX_MODE_LEN 20
#define NUM_CATEGORIES 9

// Standard Allowed Categories
static const char *CATEGORIES[NUM_CATEGORIES] = {
    "Food", "Transport", "Rent", "Shopping",
    "Bills", "Health", "Entertainment", "Books", "Other"
};

// Default monthly limits in Rupees (INR)
static const double DEFAULT_BUDGETS[NUM_CATEGORIES] = {
    6000.0, 2500.0, 9000.0, 3000.0,
    2500.0, 2000.0, 2000.0, 1500.0, 1500.0
};

typedef struct {
    int id;
    char date[MAX_DATE_LEN];        // Format: YYYY-MM-DD
    double amount;
    char category[MAX_CAT_LEN];
    char note[MAX_NOTE_LEN];
    char payment_mode[MAX_MODE_LEN];
} Expense;

typedef struct {
    Expense items[MAX_EXPENSES];
    int count;
    int next_id;
} ExpenseBook;

// --- Helper Functions ---

int is_valid_category(const char *cat) {
    for (int i = 0; i < NUM_CATEGORIES; i++) {
        if (strcasecmp(cat, CATEGORIES[i]) == 0) {
            return i; // return index
        }
    }
    return -1; // invalid
}

int is_valid_date(const char *date) {
    if (strlen(date) != 10) return 0;
    if (date[4] != '-' || date[7] != '-') return 0;
    for (int i = 0; i < 10; i++) {
        if (i == 4 || i == 7) continue;
        if (!isdigit(date[i])) return 0;
    }
    int year, month, day;
    sscanf(date, "%d-%d-%d", &year, &month, &day);
    if (year < 2000 || year > 2100) return 0;
    if (month < 1 || month > 12) return 0;
    if (day < 1 || day > 31) return 0;
    return 1;
}

void get_today_date(char *dest) {
    time_t t = time(NULL);
    struct tm *tm_info = localtime(&t);
    strftime(dest, MAX_DATE_LEN, "%Y-%m-%d", tm_info);
}

// --- Core Expense Operations ---

void init_book(ExpenseBook *book) {
    book->count = 0;
    book->next_id = 1;
}

int add_expense(ExpenseBook *book, const char *date, double amount, const char *category, const char *note, const char *mode) {
    if (amount <= 0.0) {
        printf("[Error] Amount must be strictly positive (got %.2f).\n", amount);
        return -1;
    }
    if (!is_valid_date(date)) {
        printf("[Error] Invalid date format '%s'. Expected YYYY-MM-DD.\n", date);
        return -1;
    }
    int cat_idx = is_valid_category(category);
    if (cat_idx == -1) {
        printf("[Error] Invalid category '%s'.\n", category);
        return -1;
    }
    if (book->count >= MAX_EXPENSES) {
        printf("[Error] Expense storage capacity reached (%d records).\n", MAX_EXPENSES);
        return -1;
    }

    Expense *e = &book->items[book->count];
    e->id = book->next_id++;
    strncpy(e->date, date, MAX_DATE_LEN - 1);
    e->date[MAX_DATE_LEN - 1] = '\0';
    e->amount = amount;
    strncpy(e->category, CATEGORIES[cat_idx], MAX_CAT_LEN - 1);
    e->category[MAX_CAT_LEN - 1] = '\0';
    strncpy(e->note, note, MAX_NOTE_LEN - 1);
    e->note[MAX_NOTE_LEN - 1] = '\0';
    strncpy(e->payment_mode, mode, MAX_MODE_LEN - 1);
    e->payment_mode[MAX_MODE_LEN - 1] = '\0';

    book->count++;
    return e->id;
}

// --- Persistence ---

int save_csv(const ExpenseBook *book, const char *filename) {
    FILE *fp = fopen(filename, "w");
    if (!fp) {
        printf("[Error] Could not open '%s' for writing.\n", filename);
        return 0;
    }
    fprintf(fp, "id,date,amount,category,note,payment_mode\n");
    for (int i = 0; i < book->count; i++) {
        const Expense *e = &book->items[i];
        fprintf(fp, "%d,%s,%.2f,%s,\"%s\",%s\n",
                e->id, e->date, e->amount, e->category, e->note, e->payment_mode);
    }
    fclose(fp);
    return 1;
}

int load_csv(ExpenseBook *book, const char *filename) {
    FILE *fp = fopen(filename, "r");
    if (!fp) return 0;

    char line[256];
    // Skip header line
    if (!fgets(line, sizeof(line), fp)) {
        fclose(fp);
        return 0;
    }

    int loaded = 0;
    while (fgets(line, sizeof(line), fp)) {
        int id;
        char date[MAX_DATE_LEN];
        double amount;
        char cat[MAX_CAT_LEN];
        char note[MAX_NOTE_LEN];
        char mode[MAX_MODE_LEN];

        // Basic CSV line parsing
        char *token = strtok(line, ",");
        if (!token) continue;
        id = atoi(token);

        token = strtok(NULL, ",");
        if (!token) continue;
        strncpy(date, token, MAX_DATE_LEN - 1);

        token = strtok(NULL, ",");
        if (!token) continue;
        amount = atof(token);

        token = strtok(NULL, ",");
        if (!token) continue;
        strncpy(cat, token, MAX_CAT_LEN - 1);

        token = strtok(NULL, ",");
        if (!token) continue;
        // Strip quotes
        if (token[0] == '"') {
            strncpy(note, token + 1, MAX_NOTE_LEN - 1);
            if (note[strlen(note) - 1] == '"') note[strlen(note) - 1] = '\0';
        } else {
            strncpy(note, token, MAX_NOTE_LEN - 1);
        }

        token = strtok(NULL, "\r\n");
        if (!token) continue;
        strncpy(mode, token, MAX_MODE_LEN - 1);

        add_expense(book, date, amount, cat, note, mode);
        loaded++;
    }
    fclose(fp);
    return loaded;
}

// --- Analytics & Reports ---

void print_summary(const ExpenseBook *book) {
    double totals[NUM_CATEGORIES] = {0.0};
    double grand_total = 0.0;

    for (int i = 0; i < book->count; i++) {
        int cat_idx = is_valid_category(book->items[i].category);
        if (cat_idx != -1) {
            totals[cat_idx] += book->items[i].amount;
            grand_total += book->items[i].amount;
        }
    }

    printf("\n======================================================\n");
    printf("         GENZ EXPENSE - CATEGORY SUMMARY              \n");
    printf("======================================================\n");
    printf("%-18s | %-12s | %-10s\n", "Category", "Spent (INR)", "Share (%)");
    printf("------------------------------------------------------\n");

    for (int i = 0; i < NUM_CATEGORIES; i++) {
        double pct = (grand_total > 0.0) ? (totals[i] / grand_total) * 100.0 : 0.0;
        printf("%-18s | Rs. %9.2f | %6.1f%%\n", CATEGORIES[i], totals[i], pct);
    }
    printf("------------------------------------------------------\n");
    printf("%-18s | Rs. %9.2f | 100.0%%\n", "TOTAL SPENT", grand_total);
    printf("======================================================\n\n");
}

void print_budget_status(const ExpenseBook *book) {
    double spent[NUM_CATEGORIES] = {0.0};
    for (int i = 0; i < book->count; i++) {
        int cat_idx = is_valid_category(book->items[i].category);
        if (cat_idx != -1) {
            spent[cat_idx] += book->items[i].amount;
        }
    }

    printf("\n========================================================================\n");
    printf("                   GENZ EXPENSE - MONTHLY BUDGET STATUS                 \n");
    printf("========================================================================\n");
    printf("%-15s | %-12s | %-12s | %-8s | %-10s\n", "Category", "Spent (Rs.)", "Limit (Rs.)", "Used %", "Status");
    printf("------------------------------------------------------------------------\n");

    double total_spent = 0.0;
    double total_limit = 0.0;

    for (int i = 0; i < NUM_CATEGORIES; i++) {
        double pct = (DEFAULT_BUDGETS[i] > 0.0) ? (spent[i] / DEFAULT_BUDGETS[i]) * 100.0 : 0.0;
        const char *status = "OK";
        if (pct > 100.0) status = "OVER";
        else if (pct >= 80.0) status = "WARNING";

        printf("%-15s | Rs. %9.2f | Rs. %9.2f | %6.1f%% | %-10s\n",
               CATEGORIES[i], spent[i], DEFAULT_BUDGETS[i], pct, status);

        total_spent += spent[i];
        total_limit += DEFAULT_BUDGETS[i];
    }
    printf("------------------------------------------------------------------------\n");
    double overall_pct = (total_limit > 0.0) ? (total_spent / total_limit) * 100.0 : 0.0;
    printf("%-15s | Rs. %9.2f | Rs. %9.2f | %6.1f%% |\n", "OVERALL TOTAL", total_spent, total_limit, overall_pct);
    printf("========================================================================\n\n");
}

void print_forecast(const ExpenseBook *book) {
    time_t t = time(NULL);
    struct tm *now = localtime(&t);
    int day_of_month = now->tm_mday;
    int days_in_month = 30; // standard 30-day month estimate

    char current_month_prefix[8];
    strftime(current_month_prefix, sizeof(current_month_prefix), "%Y-%m", now);

    double month_spent = 0.0;
    for (int i = 0; i < book->count; i++) {
        if (strncmp(book->items[i].date, current_month_prefix, 7) == 0) {
            month_spent += book->items[i].amount;
        }
    }

    double daily_pace = (day_of_month > 0) ? (month_spent / day_of_month) : 0.0;
    double projected_total = daily_pace * days_in_month;

    printf("\n======================================================\n");
    printf("        GENZ EXPENSE - MONTH-END RUN-RATE FORECAST    \n");
    printf("======================================================\n");
    printf(" Current Billing Month   : %s\n", current_month_prefix);
    printf(" Days Elapsed / Total    : %d / %d days\n", day_of_month, days_in_month);
    printf(" Spent So Far This Month : Rs. %.2f\n", month_spent);
    printf(" Current Daily Pace      : Rs. %.2f / day\n", daily_pace);
    printf(" Projected Month-End     : Rs. %.2f\n", projected_total);
    printf(" Formula: (Month_Spent / Days_Elapsed) * Days_In_Month\n");
    printf("======================================================\n\n");
}

void seed_sample_data(ExpenseBook *book) {
    add_expense(book, "2026-11-01", 9000.00, "Rent", "Monthly hostel / flat rent", "Net Banking");
    add_expense(book, "2026-11-01", 246.00, "Food", "College canteen lunch", "UPI");
    add_expense(book, "2026-11-02", 197.00, "Transport", "Metro smart card recharge", "Card");
    add_expense(book, "2026-11-03", 649.00, "Entertainment", "Netflix Premium monthly subscription", "UPI");
    add_expense(book, "2026-11-04", 1614.00, "Shopping", "Zara hoodie and sneakers", "Card");
    add_expense(book, "2026-11-05", 350.00, "Food", "Swiggy dinner bowl", "UPI");
    add_expense(book, "2026-11-06", 119.00, "Entertainment", "Spotify Student plan", "UPI");
    add_expense(book, "2026-11-07", 686.00, "Health", "Supplements & pharmacy", "Card");
    add_expense(book, "2026-11-08", 182.00, "Other", "Stationery & printing", "Cash");
}

// --- Main Interactive Terminal CLI ---

int main(int argc, char *argv[]) {
    ExpenseBook book;
    init_book(&book);

    // Try loading existing CSV or seed default sample
    if (!load_csv(&book, "expenses.csv")) {
        seed_sample_data(&book);
        save_csv(&book, "expenses.csv");
    }

    printf("\n======================================================\n");
    printf("        WELCOME TO GENZ EXPENSE TRACKER (C ENGINE)    \n");
    printf("======================================================\n");
    printf("Loaded %d expense records from database.\n", book.count);

    int choice;
    while (1) {
        printf("\n--- MAIN MENU ---\n");
        printf("1. View All Recent Expenses\n");
        printf("2. Log New Expense\n");
        printf("3. Category Spending Breakdown\n");
        printf("4. Budget vs Actual Status\n");
        printf("5. Month-End Forecast\n");
        printf("6. Save & Exit\n");
        printf("Select option (1-6): ");

        if (scanf("%d", &choice) != 1) {
            while (getchar() != '\n'); // clear input buffer
            printf("Invalid input. Please enter a number between 1 and 6.\n");
            continue;
        }

        if (choice == 1) {
            printf("\n--- RECENT EXPENSES (%d Records) ---\n", book.count);
            printf("%-4s | %-10s | %-14s | %-10s | %-12s | %s\n",
                   "ID", "Date", "Category", "Amount", "Mode", "Note");
            printf("-------------------------------------------------------------------------------\n");
            int start = (book.count > 15) ? book.count - 15 : 0;
            for (int i = start; i < book.count; i++) {
                Expense *e = &book.items[i];
                printf("%-4d | %-10s | %-14s | Rs. %7.2f | %-12s | %s\n",
                       e->id, e->date, e->category, e->amount, e->payment_mode, e->note);
            }
        } else if (choice == 2) {
            double amount;
            char category[MAX_CAT_LEN];
            char note[MAX_NOTE_LEN];
            char mode[MAX_MODE_LEN];
            char date[MAX_DATE_LEN];

            printf("\nEnter Amount (Rs.): ");
            scanf("%lf", &amount);

            printf("Categories: Food, Transport, Rent, Shopping, Bills, Health, Entertainment, Books, Other\n");
            printf("Enter Category: ");
            scanf("%s", category);

            printf("Enter Note/Merchant: ");
            getchar(); // flush newline
            fgets(note, sizeof(note), stdin);
            note[strcspn(note, "\r\n")] = '\0'; // trim newline

            printf("Enter Payment Mode (UPI, Card, Cash, Net Banking): ");
            scanf("%s", mode);

            get_today_date(date);
            int res = add_expense(&book, date, amount, category, note, mode);
            if (res > 0) {
                printf("[Success] Recorded Expense #%d for Rs. %.2f in %s!\n", res, amount, category);
                save_csv(&book, "expenses.csv");
            }
        } else if (choice == 3) {
            print_summary(&book);
        } else if (choice == 4) {
            print_budget_status(&book);
        } else if (choice == 5) {
            print_forecast(&book);
        } else if (choice == 6) {
            save_csv(&book, "expenses.csv");
            printf("\nSaved %d records to expenses.csv. Goodbye!\n", book.count);
            break;
        } else {
            printf("Invalid selection. Try again.\n");
        }
    }

    return 0;
}
