/**
 * data_layer.h - C Data Layer Header (Member 1: Backend Data Layer)
 * GenZ Expense Tracker
 */

#ifndef DATA_LAYER_H
#define DATA_LAYER_H

#define MAX_EXPENSES 1000
#define MAX_NOTE_LEN 100
#define MAX_DATE_LEN 11
#define MAX_CAT_LEN 30
#define MAX_MODE_LEN 20
#define NUM_CATEGORIES 9

// Standard allowed categories
extern const char *CATEGORIES[NUM_CATEGORIES];
extern const double DEFAULT_BUDGETS[NUM_CATEGORIES];

typedef struct {
    int id;
    char date[MAX_DATE_LEN];        // YYYY-MM-DD
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

// Lifecycle & Validations
void init_book(ExpenseBook *book);
int is_valid_category(const char *cat);
int is_valid_date(const char *date);
void get_today_date(char *dest);

// CRUD Operations
int add_expense(ExpenseBook *book, const char *date, double amount, const char *category, const char *note, const char *mode);
int delete_expense(ExpenseBook *book, int id);
const Expense* get_expense_by_id(const ExpenseBook *book, int id);

// Persistence
int save_csv(const ExpenseBook *book, const char *filename);
int load_csv(ExpenseBook *book, const char *filename);

#endif // DATA_LAYER_H
