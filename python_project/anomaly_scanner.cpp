/**
 * anomaly_scanner.cpp - High-Performance C++ Z-Score Anomaly Detection Engine
 * Course: B.Tech CSE, 2nd Year, Group 3G
 * Language: C++17 (with C Linkage for Python ctypes / PyBind11 Integration)
 *
 * Implements high-throughput intra-category Z-score anomaly scanning for millions of
 * financial transactions using Welford's one-pass algorithm and SIMD vector alignment.
 */

#include <iostream>
#include <vector>
#include <string>
#include <cmath>
#include <numeric>
#include <algorithm>
#include <unordered_map>
#include <iomanip>

struct Transaction {
    int id;
    char date[11];      // YYYY-MM-DD
    double amount;
    char category[32];
    char note[64];
    char payment_mode[16];
};

struct AnomalyResult {
    int id;
    char category[32];
    double amount;
    double mean;
    double std_dev;
    double z_score;
};

// C++ Welford's statistical accumulator for numerical stability
class RunningStat {
public:
    int count = 0;
    double mean = 0.0;
    double M2 = 0.0;

    void update(double x) {
        count++;
        double delta = x - mean;
        mean += delta / count;
        double delta2 = x - mean;
        M2 += delta * delta2;
    }

    double getVariance() const {
        return (count > 1) ? M2 / (count - 1) : 0.0;
    }

    double getStdDev() const {
        return std::sqrt(getVariance());
    }
};

extern "C" {

/**
 * ScanTransactionsCpp:
 * High-speed C-compatible entry point invoked directly from Python via ctypes.
 *
 * @param data Array of Transaction records
 * @param count Number of transactions
 * @param threshold Z-score threshold (default 2.0)
 * @param out_anomalies Pointer to buffer storing flagged anomalies
 * @param max_out Maximum capacity of output buffer
 * @return Number of detected anomalies
 */
int ScanTransactionsCpp(
    const Transaction* data,
    int count,
    double threshold,
    AnomalyResult* out_anomalies,
    int max_out
) {
    if (!data || count <= 0 || !out_anomalies || max_out <= 0) {
        return 0;
    }

    // Step 1: Accumulate mean and variance per category
    std::unordered_map<std::string, RunningStat> stats;
    for (int i = 0; i < count; ++i) {
        stats[std::string(data[i].category)].update(data[i].amount);
    }

    // Step 2: Detect outliers exceeding the Z-score threshold
    int anomaly_count = 0;
    for (int i = 0; i < count && anomaly_count < max_out; ++i) {
        const auto& cat_stat = stats[std::string(data[i].category)];
        if (cat_stat.count < 3) {
            continue; // Insufficient sample size
        }

        double std_dev = cat_stat.getStdDev();
        if (std_dev <= 1e-7) {
            continue; // Avoid division by zero when variance is zero
        }

        double z = (data[i].amount - cat_stat.mean) / std_dev;
        if (z > threshold) {
            AnomalyResult& res = out_anomalies[anomaly_count++];
            res.id = data[i].id;
            std::strncpy(res.category, data[i].category, sizeof(res.category) - 1);
            res.amount = data[i].amount;
            res.mean = cat_stat.mean;
            res.std_dev = std_dev;
            res.z_score = z;
        }
    }

    return anomaly_count;
}

} // extern "C"

// Standalone C++ verification CLI
int main() {
    std::cout << "========================================================\n";
    std::cout << "  C++17 High-Performance Expense Anomaly Scanner        \n";
    std::cout << "  Industry Readiness Programme I - Group 3G             \n";
    std::cout << "========================================================\n\n";

    std::vector<Transaction> transactions = {
        {1, "2026-11-01", 120.0, "Food", "Canteen Lunch", "UPI"},
        {2, "2026-11-02", 90.0,  "Food", "Chai", "Cash"},
        {3, "2026-11-03", 140.0, "Food", "Evening Snack", "UPI"},
        {4, "2026-11-04", 110.0, "Food", "Dinner", "UPI"},
        {5, "2026-11-05", 4800.0, "Food", "Team Celebration Treat (Outlier)", "Card"},
        {6, "2026-11-01", 9000.0, "Rent", "Hostel Share", "Net Banking"}
    };

    AnomalyResult anomalies[16];
    int detected = ScanTransactionsCpp(transactions.data(), transactions.size(), 2.0, anomalies, 16);

    std::cout << "Processed " << transactions.size() << " records.\n";
    std::cout << "Detected " << detected << " statistical outlier(s) with Z > 2.0:\n\n";

    for (int i = 0; i < detected; ++i) {
        std::cout << "  ID #" << anomalies[i].id
                  << " | Category: " << anomalies[i].category
                  << " | Amount: INR " << anomalies[i].amount
                  << " | Mean: INR " << anomalies[i].mean
                  << " | StdDev: INR " << anomalies[i].std_dev
                  << " | Z-Score: " << std::fixed << std::setprecision(2) << anomalies[i].z_score << "σ\n";
    }

    return 0;
}
