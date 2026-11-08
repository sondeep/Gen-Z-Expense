# Role 2: Analytics & Mathematical Intelligence Engine (Member 2)

**Candidate/Owner**: Member 2  
**Project**: GenZ Expense Tracker with Spending Insights  
**Languages**: Python 3.10+, C (C99/C11), Modern C++ (C++17)  

---

## 1. Responsibilities & Deliverables
Member 2 owns all financial analytics, category aggregations, budget threshold alerts, and forecasting models:
1. **Category Aggregation & Share Percentage**:
   - Summing expenses by category over arbitrary time intervals.
   - Normalizing shares to 100% and generating ASCII progress-bar visual distributions.
2. **Budget Health & Multi-tier Alert Classification**:
   - Computing percentage used: `used_pct = (spent / limit) * 100`.
   - 3-tier state evaluation:
     - `OK`: `used_pct < 80.0%`
     - `Warning`: `80.0% <= used_pct < 100.0%`
     - `Over`: `used_pct >= 100.0%`
3. **Month-End Velocity Run-Rate Forecasting**:
   - Dynamic calendar calculation using actual days in current month (28, 29, 30, or 31).
   - Linear formula:
     $$\text{Daily Burn Rate} = \frac{\text{Spent in Current Month}}{\text{Elapsed Days}}$$
     $$\text{Month-End Projected Total} = \text{Daily Burn Rate} \times \text{Days in Month}$$
4. **Intra-Category Z-Score Outlier Detection**:
   - `z = (amount - mean) / std_dev`.
   - Flags transactions exceeding $2.0\sigma$ without cross-category skew (e.g. rent vs coffee).
   - Implemented in Python (`insights.py`) and accelerated in high-performance C++ (`anomaly_scanner.cpp`) using Welford's one-pass algorithm.

---

## 2. File Manifest

| Language | File | Description |
| :--- | :--- | :--- |
| **Python** | `insights.py` | Statistical analytics module (category breakdown, monthly trend, budget health, Z-score anomalies, forecast). |
| **C++** | `anomaly_scanner.cpp` | C++17 Welford one-pass statistical accumulator with SIMD alignment for high-throughput anomaly detection. |
| **C++** | `budget_engine.hpp` | Header declaring `BudgetEngine` with STL maps, aggregations, and report renderers. |
| **C++** | `budget_engine.cpp` | Implementation of `BudgetEngine` methods and forecast projection. |
| **C** | `analytics_engine.h` | C header declaring procedural aggregation and budget warning functions. |
| **C** | `analytics_engine.c` | Pure ANSI C implementation of category share, budget classification, and velocity forecasting. |

---

## 3. How to Execute & Verify Member 2 Code

### Python Analytics:
```bash
# Test analytics functions directly via unit tests:
python3 test_basic.py
```

### C++ Anomaly Scanner:
```bash
# Compile and run high-speed C++ anomaly engine:
g++ -std=c++17 -O2 anomaly_scanner.cpp -o anomaly_scanner
./anomaly_scanner
```

---

## 4. Examiner Viva Voce Defense Points (Member 2)
- **Q: Why is Z-score calculated per category rather than globally?**  
  *A*: A ₹9,000 rent payment is completely normal for accommodation, but a ₹4,800 dinner is an extreme outlier for food. Global calculation would falsely flag standard rent or miss major food splurges. Category-isolated Z-scores eliminate this bias.
- **Q: Why use Welford's algorithm in C++?**  
  *A*: The textbook variance formula $\sum(x_i - \bar{x})^2$ requires two passes over the dataset and suffers from catastrophic numerical cancellation. Welford's algorithm updates mean and $M_2$ in a single streaming pass in $O(N)$ time with minimal floating-point error.
