/**
 * budget_engine.cpp - C++ Budget & Statistical Intelligence Implementation (Member 2: Analytics)
 * GenZ Expense Tracker
 */

#include "budget_engine.hpp"
#include <iostream>
#include <iomanip>
#include <ctime>

namespace GenZExpense {

std::map<std::string, double> BudgetEngine::getCategoryBreakdown(const std::vector<Expense>& list) {
    std::map<std::string, double> summary;
    for (const auto& cat : CATEGORIES) summary[cat] = 0.0;
    for (const auto& e : list) {
        summary[e.getCategory()] += e.getAmount();
    }
    return summary;
}

std::vector<BudgetHealthItem> BudgetEngine::evaluateHealth(const std::vector<Expense>& list, const std::string& month_prefix) {
    std::map<std::string, double> monthly_spent;
    for (const auto& cat : CATEGORIES) monthly_spent[cat] = 0.0;

    for (const auto& e : list) {
        if (e.getDate().rfind(month_prefix, 0) == 0) {
            monthly_spent[e.getCategory()] += e.getAmount();
        }
    }

    std::vector<BudgetHealthItem> items;
    for (const auto& cat : CATEGORIES) {
        double limit = DEFAULT_LIMITS.at(cat);
        double spent = monthly_spent[cat];
        double pct = (limit > 0.0) ? (spent / limit * 100.0) : 0.0;

        std::string status = "OK";
        if (pct >= 100.0) status = "Over";
        else if (pct >= 80.0) status = "Warning";

        items.push_back({cat, spent, limit, pct, status});
    }
    return items;
}

double BudgetEngine::computeForecast(const std::vector<Expense>& list, const std::string& month_prefix, int current_day, int days_in_month) {
    if (current_day <= 0) current_day = 1;
    double spent = 0.0;
    for (const auto& e : list) {
        if (e.getDate().rfind(month_prefix, 0) == 0) {
            spent += e.getAmount();
        }
    }
    double daily_pace = spent / static_cast<double>(current_day);
    return daily_pace * static_cast<double>(days_in_month);
}

void BudgetEngine::printCategoryReport(const std::vector<Expense>& list) {
    auto summary = getCategoryBreakdown(list);
    double total = 0.0;
    for (const auto& [_, amt] : summary) total += amt;

    std::cout << "\n=========== SPENDING BREAKDOWN (C++ ENGINE) ===========\n";
    for (const auto& [cat, amt] : summary) {
        double pct = total > 0 ? (amt / total * 100.0) : 0.0;
        std::cout << "  " << std::left << std::setw(15) << cat
                  << " INR " << std::right << std::setw(9) << std::fixed << std::setprecision(2) << amt
                  << "  (" << std::setw(5) << std::setprecision(1) << pct << "%)  ";
        int bars = static_cast<int>(pct / 4.0);
        for (int b = 0; b < bars; ++b) std::cout << "#";
        std::cout << "\n";
    }
    std::cout << "--------------------------------------------------------\n";
    std::cout << "  " << std::left << std::setw(15) << "TOTAL SPENT"
              << " INR " << std::right << std::setw(9) << total << "\n";
}

void BudgetEngine::printBudgetStatus(const std::vector<Expense>& list) {
    time_t t = time(nullptr);
    struct tm* tm_info = localtime(&t);
    char current_month[8];
    strftime(current_month, sizeof(current_month), "%Y-%m", tm_info);

    auto items = evaluateHealth(list, current_month);

    std::cout << "\n============= BUDGET STATUS (" << current_month << ") =============\n";
    std::cout << "  " << std::left << std::setw(14) << "Category"
              << std::setw(12) << "Spent"
              << std::setw(12) << "Budget"
              << std::setw(10) << "Used %"
              << "Status\n";
    std::cout << "---------------------------------------------------------\n";

    for (const auto& item : items) {
        std::string status_label = "[OK]";
        if (item.status == "Over") status_label = "[OVER BUDGET !]";
        else if (item.status == "Warning") status_label = "[WARNING 80%+]";

        std::cout << "  " << std::left << std::setw(14) << item.category
                  << " INR " << std::right << std::setw(7) << std::fixed << std::setprecision(2) << item.spent
                  << "  INR " << std::setw(7) << item.limit
                  << "  " << std::setw(6) << std::setprecision(1) << item.used_pct << "%  "
                  << status_label << "\n";
    }
}

void BudgetEngine::printForecast(const std::vector<Expense>& list) {
    time_t t = time(nullptr);
    struct tm* tm_info = localtime(&t);
    int day = tm_info->tm_mday;
    char current_month[8];
    strftime(current_month, sizeof(current_month), "%Y-%m", tm_info);

    int month = tm_info->tm_mon + 1;
    int year = tm_info->tm_year + 1900;
    int days_in_month = 31;
    if (month == 4 || month == 6 || month == 9 || month == 11) days_in_month = 30;
    else if (month == 2) {
        days_in_month = ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) ? 29 : 28;
    }

    double forecast = computeForecast(list, current_month, day, days_in_month);

    std::cout << "\n=============== MONTH-END FORECAST (C++17) ===============\n";
    std::cout << "  Current Period:          " << current_month << " (Day " << day << " of " << days_in_month << ")\n";
    std::cout << "  Run-Rate Projection:     INR " << std::fixed << std::setprecision(2) << forecast << "\n";
    std::cout << "===========================================================\n";
}

} // namespace GenZExpense
