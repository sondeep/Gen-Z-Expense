/**
 * expense_tracker.cpp - GenZ Expense Tracker in Modern C++ (C++17)
 *
 * Object-Oriented Architecture:
 * - Expense model class with validations and serialization
 * - ExpenseManager class managing SQLite or CSV storage
 * - BudgetEngine computing category percentages, warning levels, and run-rate projections
 * - Interactive terminal CLI
 */

#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <iomanip>
#include <fstream>
#include <sstream>
#include <ctime>
#include <algorithm>
#include <memory>
#include <stdexcept>
#include <cmath>

namespace GenZExpense {

const std::vector<std::string> CATEGORIES = {
    "Food", "Transport", "Rent", "Shopping",
    "Bills", "Health", "Entertainment", "Books", "Other"
};

const std::map<std::string, double> DEFAULT_LIMITS = {
    {"Food", 6000.0},
    {"Transport", 2500.0},
    {"Rent", 9000.0},
    {"Shopping", 3000.0},
    {"Bills", 2500.0},
    {"Health", 2000.0},
    {"Entertainment", 2000.0},
    {"Books", 1500.0},
    {"Other", 1500.0}
};

class Expense {
private:
    int id_;
    std::string date_;
    double amount_;
    std::string category_;
    std::string note_;
    std::string payment_mode_;

public:
    Expense(int id, const std::string& date, double amount,
            const std::string& category, const std::string& note,
            const std::string& payment_mode)
        : id_(id), date_(date), amount_(amount),
          category_(category), note_(note), payment_mode_(payment_mode) {
        validate();
    }

    void validate() const {
        if (amount_ <= 0.0) {
            throw std::invalid_argument("Expense amount must be strictly greater than 0.");
        }
        if (date_.length() != 10 || date_[4] != '-' || date_[7] != '-') {
            throw std::invalid_argument("Date must be formatted as YYYY-MM-DD.");
        }
        auto it = std::find_if(CATEGORIES.begin(), CATEGORIES.end(),
            [this](const std::string& c) {
                return strcasecmp(c.c_str(), category_.c_str()) == 0;
            });
        if (it == CATEGORIES.end()) {
            throw std::invalid_argument("Invalid category: " + category_);
        }
    }

    int getId() const { return id_; }
    const std::string& getDate() const { return date_; }
    double getAmount() const { return amount_; }
    const std::string& getCategory() const { return category_; }
    const std::string& getNote() const { return note_; }
    const std::string& getPaymentMode() const { return payment_mode_; }

    std::string toCsvRow() const {
        std::ostringstream ss;
        ss << id_ << "," << date_ << "," << std::fixed << std::setprecision(2) << amount_
           << "," << category_ << ",\"" << note_ << "\"," << payment_mode_;
        return ss.str();
    }
};

class ExpenseManager {
private:
    std::vector<Expense> expenses_;
    int next_id_ = 1;

public:
    int addExpense(const std::string& date, double amount,
                   const std::string& category, const std::string& note,
                   const std::string& payment_mode) {
        Expense exp(next_id_++, date, amount, category, note, payment_mode);
        expenses_.push_back(exp);
        return exp.getId();
    }

    const std::vector<Expense>& getExpenses() const {
        return expenses_;
    }

    void saveToCsv(const std::string& filepath) const {
        std::ofstream file(filepath);
        if (!file.is_open()) {
            throw std::runtime_error("Failed to open file for writing: " + filepath);
        }
        file << "id,date,amount,category,note,payment_mode\n";
        for (const auto& e : expenses_) {
            file << e.toCsvRow() << "\n";
        }
    }

    void loadFromCsv(const std::string& filepath) {
        std::ifstream file(filepath);
        if (!file.is_open()) return;

        std::string line;
        if (!std::getline(file, line)) return; // skip header

        while (std::getline(file, line)) {
            if (line.empty()) continue;
            std::stringstream ss(line);
            std::string id_str, date, amt_str, cat, note, mode;

            std::getline(ss, id_str, ',');
            std::getline(ss, date, ',');
            std::getline(ss, amt_str, ',');
            std::getline(ss, cat, ',');

            if (ss.peek() == '"') {
                ss.get(); // skip quote
                std::getline(ss, note, '"');
                if (ss.peek() == ',') ss.get();
            } else {
                std::getline(ss, note, ',');
            }
            std::getline(ss, mode);

            try {
                double amt = std::stod(amt_str);
                addExpense(date, amt, cat, note, mode);
            } catch (...) {
                // skip corrupted lines
            }
        }
    }

    void seedDefaultData() {
        addExpense("2026-11-01", 9000.0, "Rent", "Hostel / Flat Monthly Rent", "Net Banking");
        addExpense("2026-11-01", 246.0, "Food", "College Canteen Lunch", "Card");
        addExpense("2026-11-02", 197.0, "Transport", "Metro Smart Card Recharge", "Card");
        addExpense("2026-11-03", 649.0, "Entertainment", "Netflix Premium Subscription", "UPI");
        addExpense("2026-11-04", 1614.0, "Shopping", "Hoodie & Sneakers", "Card");
        addExpense("2026-11-05", 350.0, "Food", "Swiggy Dinner Bowl", "UPI");
        addExpense("2026-11-06", 119.0, "Entertainment", "Spotify Student Plan", "UPI");
        addExpense("2026-11-07", 686.0, "Health", "Pharmacy & Vitamins", "Card");
        addExpense("2026-11-08", 182.0, "Other", "Study Material & Printouts", "Cash");
    }
};

class BudgetEngine {
public:
    static std::map<std::string, double> getCategorySummary(const std::vector<Expense>& expenses) {
        std::map<std::string, double> summary;
        for (const auto& cat : CATEGORIES) {
            summary[cat] = 0.0;
        }
        for (const auto& e : expenses) {
            summary[e.getCategory()] += e.getAmount();
        }
        return summary;
    }

    static void displayBudgetReport(const std::vector<Expense>& expenses) {
        auto summary = getCategorySummary(expenses);
        double total_spend = 0.0;
        double total_budget = 0.0;

        std::cout << "\n========================================================================\n";
        std::cout << "                 GENZ EXPENSE - C++ BUDGET INTELLIGENCE                 \n";
        std::cout << "========================================================================\n";
        std::cout << std::left << std::setw(16) << "Category"
                  << " | " << std::setw(12) << "Spent (INR)"
                  << " | " << std::setw(12) << "Limit (INR)"
                  << " | " << std::setw(8)  << "Used %"
                  << " | " << "Status\n";
        std::cout << "------------------------------------------------------------------------\n";

        for (const auto& cat : CATEGORIES) {
            double spent = summary[cat];
            double limit = DEFAULT_LIMITS.at(cat);
            double pct = (limit > 0.0) ? (spent / limit) * 100.0 : 0.0;
            std::string status = "OK";
            if (pct > 100.0) status = "OVER";
            else if (pct >= 80.0) status = "WARNING";

            std::cout << std::left << std::setw(16) << cat
                      << " | Rs. " << std::right << std::setw(8) << std::fixed << std::setprecision(2) << spent
                      << " | Rs. " << std::right << std::setw(8) << limit
                      << " | " << std::right << std::setw(6) << std::setprecision(1) << pct << "%"
                      << " | " << status << "\n";

            total_spend += spent;
            total_budget += limit;
        }

        std::cout << "------------------------------------------------------------------------\n";
        double overall_pct = (total_budget > 0.0) ? (total_spend / total_budget) * 100.0 : 0.0;
        std::cout << std::left << std::setw(16) << "TOTAL"
                  << " | Rs. " << std::right << std::setw(8) << total_spend
                  << " | Rs. " << std::right << std::setw(8) << total_budget
                  << " | " << std::right << std::setw(6) << overall_pct << "%\n";
        std::cout << "========================================================================\n\n";
    }

    static void displayRunRateForecast(const std::vector<Expense>& expenses) {
        std::time_t t = std::time(nullptr);
        std::tm* now = std::localtime(&t);
        int day = now->tm_mday;
        int total_days = 30;

        char month_prefix[8];
        std::strftime(month_prefix, sizeof(month_prefix), "%Y-%m", now);

        double month_spent = 0.0;
        for (const auto& e : expenses) {
            if (e.getDate().substr(0, 7) == month_prefix) {
                month_spent += e.getAmount();
            }
        }

        double daily_burn = (day > 0) ? (month_spent / day) : 0.0;
        double forecast_total = daily_burn * total_days;

        std::cout << "\n======================================================\n";
        std::cout << "       GENZ EXPENSE - MONTH-END RUN-RATE FORECAST     \n";
        std::cout << "======================================================\n";
        std::cout << " Active Billing Month   : " << month_prefix << "\n";
        std::cout << " Elapsed Days           : " << day << " of " << total_days << " days\n";
        std::cout << " Current Month Spend    : Rs. " << std::fixed << std::setprecision(2) << month_spent << "\n";
        std::cout << " Current Daily Burn Pace: Rs. " << daily_burn << " / day\n";
        std::cout << " Month-End Projected    : Rs. " << forecast_total << "\n";
        std::cout << " Formula: (Month_Spent / Days_Elapsed) * Total_Days\n";
        std::cout << "======================================================\n\n";
    }
};

} // namespace GenZExpense

int main() {
    using namespace GenZExpense;

    ExpenseManager manager;
    try {
        manager.loadFromCsv("expenses.csv");
    } catch (...) {}

    if (manager.getExpenses().empty()) {
        manager.seedDefaultData();
        manager.saveToCsv("expenses.csv");
    }

    std::cout << "\n======================================================\n";
    std::cout << "      GENZ EXPENSE TRACKER - MODERN C++17 ENGINE      \n";
    std::cout << "======================================================\n";
    std::cout << "Loaded " << manager.getExpenses().size() << " records from database.\n";

    int choice = 0;
    while (choice != 6) {
        std::cout << "\n--- MAIN MENU ---\n";
        std::cout << "1. View Recent Expenses\n";
        std::cout << "2. Log New Expense\n";
        std::cout << "3. Budget vs Actual Intelligence Report\n";
        std::cout << "4. Month-End Run-Rate Forecast\n";
        std::cout << "5. Save to CSV\n";
        std::cout << "6. Exit\n";
        std::cout << "Choose an option (1-6): ";

        if (!(std::cin >> choice)) {
            std::cin.clear();
            std::cin.ignore(1000, '\n');
            std::cout << "Invalid input. Please enter a valid number.\n";
            continue;
        }

        switch (choice) {
            case 1: {
                const auto& list = manager.getExpenses();
                std::cout << "\n--- RECENT TRANSACTIONS (" << list.size() << " Records) ---\n";
                int start = (list.size() > 15) ? list.size() - 15 : 0;
                for (size_t i = start; i < list.size(); ++i) {
                    const auto& e = list[i];
                    std::cout << "#" << e.getId() << " | " << e.getDate()
                              << " | " << std::left << std::setw(14) << e.getCategory()
                              << " | Rs. " << std::right << std::setw(8) << std::fixed << std::setprecision(2) << e.getAmount()
                              << " | " << std::left << std::setw(12) << e.getPaymentMode()
                              << " | " << e.getNote() << "\n";
                }
                break;
            }
            case 2: {
                double amt;
                std::string cat, note, mode;
                std::cout << "Enter Amount (Rs.): ";
                std::cin >> amt;
                std::cout << "Category (Food, Transport, Rent, Shopping, Bills, Health, Entertainment, Books, Other): ";
                std::cin >> cat;
                std::cout << "Merchant / Note: ";
                std::cin.ignore();
                std::getline(std::cin, note);
                std::cout << "Payment Mode (UPI, Card, Cash, Net Banking): ";
                std::getline(std::cin, mode);

                std::time_t t = std::time(nullptr);
                char date_buf[11];
                std::strftime(date_buf, sizeof(date_buf), "%Y-%m-%d", std::localtime(&t));

                try {
                    int id = manager.addExpense(date_buf, amt, cat, note, mode);
                    std::cout << "[Success] Logged Expense #" << id << " for Rs. " << amt << " in " << cat << "!\n";
                    manager.saveToCsv("expenses.csv");
                } catch (const std::exception& ex) {
                    std::cout << "[Validation Error] " << ex.what() << "\n";
                }
                break;
            }
            case 3:
                BudgetEngine::displayBudgetReport(manager.getExpenses());
                break;
            case 4:
                BudgetEngine::displayRunRateForecast(manager.getExpenses());
                break;
            case 5:
                manager.saveToCsv("expenses.csv");
                std::cout << "[Success] Saved to expenses.csv successfully.\n";
                break;
            case 6:
                manager.saveToCsv("expenses.csv");
                std::cout << "Goodbye!\n";
                break;
            default:
                std::cout << "Invalid option. Select 1 to 6.\n";
                break;
        }
    }

    return 0;
}
