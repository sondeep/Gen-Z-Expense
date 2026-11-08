/**
 * data_layer.c - C Data Layer Implementation (Member 1: Backend Data Layer)
 * GenZ Expense Tracker
 */

#include "data_layer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <ctype.h>

const char *CATEGORIES[NUM_CATEGORIES] = {
    "Food", "Transport", "Rent", "Shopping",
    "Bills", "Health", "Entertainment", "Books", "Other"
};

const double DEFAULT_BUDGETS[NUM_CATEGORIES] = {
    6000.0, 2500.0, 9000.0, 3000.0,
    2500.0, 2000.0, 2000.0, 1500.0, 1500.0
};

void init_book(ExpenseBook *book) {
    book->count = 0;
    book->next_id = 1;
}

int is_valid_category(const char *cat) {
    for (int i = 0; i < NUM_CATEGORIES; i++) {
        #ifdef _WIN32
        if (_stricmp(cat, CATEGORIES[i]) == 0) return i;
        #else
        if (strcasecmp(cat, CATEGORIES[i]) == 0) return i;
        #endif
    }
    return -1;
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

int add_expense(ExpenseBook *book, const char *date, double amount, const char *category, const char *note, const char *mode) {
    if (amount <= 0.0) {
        printf("[Role 1 Error] Amount must be positive (got %.2f).\n", amount);
        return -1;
    }
    if (!is_valid_date(date)) {
        printf("[Role 1 Error] Invalid date format '%s'. Expected YYYY-MM-DD.\n", date);
        return -1;
    }
    int cat_idx = is_valid_category(category);
    if (cat_idx == -1) {
        printf("[Role 1 Error] Invalid category '%s'.\n", category);
        return -1;
    }
    if (book->count >= MAX_EXPENSES) {
        printf("[Role 1 Error] Capacity reached (%d records).\n", MAX_EXPENSES);
        return -1;
    }

    Expense *e = &book->items[book->count];
    e->id = book->next_id++;
    strncpy(e->date, date, MAX_DATE_LEN - 1);
    e->date[MAX_DATE_LEN - 1] = '\0';
    e->amount = amount;
    strncpy(e->category, CATEGORIES[cat_idx], MAX_CAT_LEN - 1);
    e->category[MAX_CAT_LEN - 1] = '\0';
    strncpy(e->note, note ? note : "", MAX_NOTE_LEN - 1);
    e->note[MAX_NOTE_LEN - 1] = '\0';
    strncpy(e->payment_mode, mode ? mode : "UPI", MAX_MODE_LEN - 1);
    e->payment_mode[MAX_MODE_LEN - 1] = '\0';

    book->count++;
    return e->id;
}

int delete_expense(ExpenseBook *book, int id) {
    int found_idx = -1;
    for (int i = 0; i < book->count; i++) {
        if (book->items[i].id == id) {
            found_idx = i;
            break;
        }
    }
    if (found_idx == -1) return 0;
    for (int i = found_idx; i < book->count - 1; i++) {
        book->items[i] = book->items[i + 1];
    }
    book->count--;
    return 1;
}

const Expense* get_expense_by_id(const ExpenseBook *book, int id) {
    for (int i = 0; i < book->count; i++) {
        if (book->items[i].id == id) return &book->items[i];
    }
    return NULL;
}

int save_csv(const ExpenseBook *book, const char *filename) {
    FILE *fp = fopen(filename, "w");
    if (!fp) return 0;
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
    if (!fgets(line, sizeof(line), fp)) {
        fclose(fp);
        return 0;
    }

    init_book(book);
    while (fgets(line, sizeof(line), fp)) {
        char *nl = strchr(line, '\n');
        if (nl) *nl = '\0';
        if (strlen(line) == 0) continue;

        int id;
        char date[MAX_DATE_LEN];
        double amt;
        char cat[MAX_CAT_LEN];
        char note[MAX_NOTE_LEN] = "";
        char mode[MAX_MODE_LEN] = "UPI";

        char *token = strtok(line, ",");
        if (!token) continue;
        id = atoi(token);

        token = strtok(NULL, ",");
        if (!token) continue;
        strncpy(date, token, MAX_DATE_LEN - 1);

        token = strtok(NULL, ",");
        if (!token) continue;
        amt = atof(token);

        token = strtok(NULL, ",");
        if (!token) continue;
        strncpy(cat, token, MAX_CAT_LEN - 1);

        token = strtok(NULL, ",\"\n");
        if (token) strncpy(note, token, MAX_NOTE_LEN - 1);

        token = strtok(NULL, ",\"\n");
        if (token) strncpy(mode, token, MAX_MODE_LEN - 1);

        int added_id = add_expense(book, date, amt, cat, note, mode);
        if (added_id != -1 && id >= book->next_id) {
            book->next_id = id + 1;
        }
    }
    fclose(fp);
    return 1;
}
