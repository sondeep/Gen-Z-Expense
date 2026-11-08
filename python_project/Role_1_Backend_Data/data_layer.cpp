/**
 * data_layer.cpp - Modern C++ Data Layer Implementation (Member 1: Backend Data Layer)
 * GenZ Expense Tracker
 */

#include "data_layer.hpp"
#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cstring>

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

Expense::Expense(int id, const std::string& date, double amount,
                 const std::string& category, const std::string& note,
                 const std::string& payment_mode)
    : id_(id), date_(date), amount_(amount),
      category_(category), note_(note), payment_mode_(payment_mode) {
    validate();
}

void Expense::validate() const {
    if (amount_ <= 0.0) {
        throw std::invalid_argument("Expense amount must be strictly positive (got " + std::to_string(amount_) + ").");
    }
    if (date_.length() != 10 || date_[4] != '-' || date_[7] != '-') {
        throw std::invalid_argument("Date must be formatted as YYYY-MM-DD (got " + date_ + ").");
    }
    auto it = std::find_if(CATEGORIES.begin(), CATEGORIES.end(),
        [this](const std::string& c) {
            #ifdef _WIN32
            return _stricmp(c.c_str(), category_.c_str()) == 0;
            #else
            return strcasecmp(c.c_str(), category_.c_str()) == 0;
            #endif
        });
    if (it == CATEGORIES.end()) {
        throw std::invalid_argument("Invalid category: " + category_);
    }
}

std::string Expense::toCsvRow() const {
    std::ostringstream ss;
    ss << id_ << "," << date_ << "," << std::fixed << std::setprecision(2) << amount_
       << "," << category_ << ",\"" << note_ << "\"," << payment_mode_;
    return ss.str();
}

int ExpenseManager::addExpense(const std::string& date, double amount,
                              const std::string& category, const std::string& note,
                              const std::string& payment_mode) {
    Expense exp(next_id_++, date, amount, category, note, payment_mode);
    expenses_.push_back(exp);
    return exp.getId();
}

bool ExpenseManager::deleteExpense(int id) {
    auto it = std::remove_if(expenses_.begin(), expenses_.end(),
        [id](const Expense& e) { return e.getId() == id; });
    if (it != expenses_.end()) {
        expenses_.erase(it, expenses_.end());
        return true;
    }
    return false;
}

void ExpenseManager::saveToCsv(const std::string& filepath) const {
    std::ofstream file(filepath);
    if (!file.is_open()) {
        throw std::runtime_error("Failed to open file for writing: " + filepath);
    }
    file << "id,date,amount,category,note,payment_mode\n";
    for (const auto& e : expenses_) {
        file << e.toCsvRow() << "\n";
    }
}

void ExpenseManager::loadFromCsv(const std::string& filepath) {
    std::ifstream file(filepath);
    if (!file.is_open()) return;

    std::string line;
    if (!std::getline(file, line)) return;

    while (std::getline(file, line)) {
        if (line.empty()) continue;
        std::stringstream ss(line);
        std::string id_str, date, amt_str, cat, note, mode;

        std::getline(ss, id_str, ',');
        std::getline(ss, date, ',');
        std::getline(ss, amt_str, ',');
        std::getline(ss, cat, ',');

        if (ss.peek() == '"') {
            ss.get();
            std::getline(ss, note, '"');
            if (ss.peek() == ',') ss.get();
        } else {
            std::getline(ss, note, ',');
        }
        std::getline(ss, mode);

        try {
            double amt = std::stod(amt_str);
            addExpense(date, amt, cat, note, mode);
        } catch (...) {}
    }
}

void ExpenseManager::seedSampleData() {
    addExpense("2026-11-01", 380.00, "Food", "Canteen meals", "UPI");
    addExpense("2026-11-02", 90.00, "Transport", "Metro ride", "UPI");
    addExpense("2026-11-03", 1499.00, "Shopping", "Power bank", "Card");
    addExpense("2026-11-04", 899.00, "Entertainment", "Game pass", "UPI");
    addExpense("2026-11-05", 220.00, "Food", "Coffee with peers", "UPI");
    addExpense("2026-11-06", 9000.00, "Rent", "Hostel accommodation", "NetBanking");
}

} // namespace GenZExpense
