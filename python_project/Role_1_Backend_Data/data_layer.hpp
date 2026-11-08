/**
 * data_layer.hpp - Modern C++ Data Layer Header (Member 1: Backend Data Layer)
 * GenZ Expense Tracker
 */

#ifndef DATA_LAYER_HPP
#define DATA_LAYER_HPP

#include <string>
#include <vector>
#include <map>
#include <stdexcept>

namespace GenZExpense {

extern const std::vector<std::string> CATEGORIES;
extern const std::map<std::string, double> DEFAULT_LIMITS;

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
            const std::string& payment_mode);

    void validate() const;

    int getId() const { return id_; }
    const std::string& getDate() const { return date_; }
    double getAmount() const { return amount_; }
    const std::string& getCategory() const { return category_; }
    const std::string& getNote() const { return note_; }
    const std::string& getPaymentMode() const { return payment_mode_; }

    std::string toCsvRow() const;
};

class ExpenseManager {
private:
    std::vector<Expense> expenses_;
    int next_id_ = 1;

public:
    int addExpense(const std::string& date, double amount,
                   const std::string& category, const std::string& note,
                   const std::string& payment_mode);

    bool deleteExpense(int id);
    const std::vector<Expense>& getExpenses() const { return expenses_; }
    void saveToCsv(const std::string& filepath) const;
    void loadFromCsv(const std::string& filepath);
    void seedSampleData();
};

} // namespace GenZExpense

#endif // DATA_LAYER_HPP
