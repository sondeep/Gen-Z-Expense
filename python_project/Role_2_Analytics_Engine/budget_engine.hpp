/**
 * budget_engine.hpp - C++ Budget & Statistical Intelligence Header (Member 2: Analytics)
 * GenZ Expense Tracker
 */

#ifndef BUDGET_ENGINE_HPP
#define BUDGET_ENGINE_HPP

#include "../Role_1_Backend_Data/data_layer.hpp"
#include <map>
#include <vector>
#include <string>

namespace GenZExpense {

struct BudgetHealthItem {
    std::string category;
    double spent;
    double limit;
    double used_pct;
    std::string status; // "OK", "Warning", "Over"
};

class BudgetEngine {
public:
    static std::map<std::string, double> getCategoryBreakdown(const std::vector<Expense>& list);
    static std::vector<BudgetHealthItem> evaluateHealth(const std::vector<Expense>& list, const std::string& month_prefix);
    static double computeForecast(const std::vector<Expense>& list, const std::string& month_prefix, int current_day, int days_in_month);

    static void printCategoryReport(const std::vector<Expense>& list);
    static void printBudgetStatus(const std::vector<Expense>& list);
    static void printForecast(const std::vector<Expense>& list);
};

} // namespace GenZExpense

#endif // BUDGET_ENGINE_HPP
