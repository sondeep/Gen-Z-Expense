# Role 4: QA, Integration & Team Lead (Member 4)

**Candidate/Owner**: Member 4 (Team Lead)  
**Project**: GenZ Expense Tracker with Spending Insights  
**Languages**: Python 3.10+, C (C99/C11), Modern C++ (C++17), Bash  

---

## 1. Responsibilities & Deliverables
Member 4 acts as the QA Lead, System Integrator, and Team Representative:
1. **Unified Command-Line Interface (CLI)**:
   - `main.py`: Interactive and scripted CLI fallback supporting flags:
     - `--summary`: Category breakdown and percentage bars.
     - `--budget`: Monthly budget vs actual health comparison.
     - `--anomalies`: Z-score outlier detection table.
     - `--forecast`: Month-end run-rate projection.
     - `--seed`: Populate 90 days of deterministic test data.
     - `--interactive`: Interactive console menu loop.
2. **Automated Unit Testing & Quality Assurance**:
   - `test_basic.py`: 14 automated unit tests verifying schema invariants, input validation edge cases, budget calculations, and CSV roundtrips.
3. **Cross-Language Native Compilations**:
   - `expense_tracker.c`: Complete standalone C program (C99/C11).
   - `expense_tracker.cpp`: Complete standalone C++ program (C++17).
4. **Project Orchestration**:
   - `requirements.txt`: Python package specification.
   - `run_all_tests.sh`: Shell script running cross-module verifications.

---

## 2. File Manifest

| Language | File | Description |
| :--- | :--- | :--- |
| **Python** | `main.py` | Terminal integration controller, interactive menu, and flag parser. |
| **Python** | `test_basic.py` | Comprehensive test suite covering all 14 project test cases (100% pass rate). |
| **Python** | `requirements.txt` | Minimal runtime requirements. |
| **C** | `expense_tracker.c` | Standalone ANSI C CLI application with CSV persistence, budget alerts, and forecast. |
| **C++** | `expense_tracker.cpp` | Standalone modern C++17 CLI application with OOP architecture, STL streams, and analytics. |
| **Bash** | `run_all_tests.sh` | Automated regression test script. |

---

## 3. How to Execute & Verify Member 4 Code

### 1. Run the Python Test Suite (14/14 Tests):
```bash
python3 test_basic.py
```

### 2. Run the Interactive Python CLI:
```bash
python3 main.py --interactive
```

### 3. Compile & Run the ANSI C Tracker:
```bash
gcc -std=c11 -O2 expense_tracker.c -o expense_tracker_c
./expense_tracker_c
```

### 4. Compile & Run the Modern C++ Tracker:
```bash
g++ -std=c++17 -O2 expense_tracker.cpp -o expense_tracker_cpp
./expense_tracker_cpp
```

---

## 4. Test Case Verification Matrix

| Test ID | Objective | Input / Condition | Expected Result | Result |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Valid Record Insertion | `2026-11-01`, `250.00`, `Food` | Saved with incremental ID | **PASS** |
| **TC-02** | Negative Amount Rejection | `-50.00`, `Food` | Raises `ValueError` | **PASS** |
| **TC-03** | Zero Amount Rejection | `0.00`, `Food` | Raises `ValueError` | **PASS** |
| **TC-04** | Invalid Date Format | `31-31-2026`, `100.00`, `Food` | Raises `ValueError` | **PASS** |
| **TC-05** | Invalid Category Enum | `100.00`, `Cryptocurrency` | Raises `ValueError` | **PASS** |
| **TC-06** | Budget Warning Threshold | ₹2,100 spent of ₹2,500 limit | Tagged `Warning` (84%) | **PASS** |
| **TC-07** | Budget Over-Limit Threshold | ₹3,500 spent of ₹3,000 limit | Tagged `Over` (116.7%) | **PASS** |
| **TC-08** | Anomaly Z-Score Trigger | ₹4,800 dinner (mean ₹250) | Z > 2.0 flagged as anomaly | **PASS** |
| **TC-09** | Month-End Run-Rate | Day 5, ₹500 spent in 30-day month | Forecast = ₹3,000 | **PASS** |
| **TC-10** | CSV Export/Import Roundtrip | Export 5 rows, clear, re-import | 5 rows restored identically | **PASS** |
