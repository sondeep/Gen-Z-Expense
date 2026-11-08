# Expense Tracker with Spending Insights

**Course**: B.Tech CSE, 2nd Year, Group 3G  
**Programme**: Industry Readiness Programme I — End Term I  
**Languages**: Python 3.11, C++17, SQLite  
**Roles Owned by Candidate**: Roles 1, 2, and 4 (Data Layer, Analytics Engine, Integration/QA/Lead) + Role 3 Frontend Integration  
**Evaluation Marks**: 100 Marks (Scaled to 50)  

---

## 1. Architectural Overview & Team Division

```
                      +-----------------------------+
                      |       USER INTERFACES       |
                      |  Streamlit (app.py) [R3]    |
                      |  CLI Fallback (main.py) [R4]|
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |      ANALYTICS ENGINE       |
                      |       insights.py [R2]      |
                      |  (Z-Score, Run-rate, Trend) |
                      |    anomaly_scanner.cpp      |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |      SQLITE DATA LAYER      |
                      |       database.py [R1]      |
                      |       config.py [R1]        |
                      |  (expenses.db, CRUD, CHECK) |
                      +-----------------------------+
```

### Team Role Allocation & Folder Directory:

The codebase is organized into 4 distinct role directories, each containing dedicated C, C++, and Python implementations:

```
python_project/
├── Role_1_Backend_Data/       # Member 1: Database & Data Modeling
│   ├── database.py            # SQLite schema, CHECK constraints, parameterized CRUD
│   ├── config.py              # Central category, payment mode & budget limits
│   ├── data_layer.h           # C data layer header (Expense & ExpenseBook)
│   ├── data_layer.c           # C data layer implementation with CSV I/O
│   ├── data_layer.hpp         # C++ data layer header (Expense class & ExpenseManager)
│   ├── data_layer.cpp         # C++ data layer implementation (RAII, STL vectors)
│   └── README.md              # Role 1 detailed documentation & defense guide
│
├── Role_2_Analytics_Engine/   # Member 2: Analytics & Mathematical Intelligence
│   ├── insights.py            # Python analytics (category summary, trend, forecast)
│   ├── anomaly_scanner.cpp    # C++ Welford algorithm high-speed Z-score detector
│   ├── analytics_engine.h     # C analytics header
│   ├── analytics_engine.c     # C category aggregations, budget health & run-rate
│   ├── budget_engine.hpp      # C++ BudgetEngine header
│   ├── budget_engine.cpp      # C++ BudgetEngine implementation
│   └── README.md              # Role 2 documentation & mathematical formulas
│
├── Role_3_Frontend_UI/        # Member 3: UI Dashboards & Ingestion
│   ├── app.py                 # Streamlit reactive dashboard
│   ├── charts.py              # Matplotlib visualizations (pie & trend charts)
│   ├── sms_parser.py          # Bank SMS regex ingestion engine (Indian banks)
│   ├── sms_tokenizer.cpp      # C++ zero-heap microsecond SMS tokenizer
│   └── README.md              # Role 3 documentation & UI guide
│
├── Role_4_QA_Integration/     # Member 4: QA, Testing & Team Lead
│   ├── main.py                # Unified CLI runner (flags & interactive mode)
│   ├── test_basic.py          # 14 automated unit tests (100% pass rate)
│   ├── expense_tracker.c      # Standalone complete ANSI C tracker
│   ├── expense_tracker.cpp    # Standalone complete Modern C++17 tracker
│   ├── run_all_tests.sh       # Master test automation script
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Role 4 documentation & test matrix
│
├── expense_tracker.c          # Top-level standalone C runner
├── expense_tracker.cpp        # Top-level standalone C++ runner
├── database.py, insights.py, main.py ... (root CLI backward-compatibility)
└── expenses.db                # SQLite database
```

---

## 2. Quickstart & Execution Guide

### Prerequisites:
```bash
python3 --version  # Python 3.10 or 3.11
```

### 1. Run Automated Unit Tests (10/10 Passing):
```bash
python3 test_basic.py
# Or with pytest:
pytest -v test_basic.py
```

### 2. Run Headless CLI Fallback:
```bash
# Seed 90 days of realistic sample data
python3 database.py

# Launch interactive CLI
python3 main.py

# Or inspect individual reports via CLI flags
python3 main.py --summary
python3 main.py --budget
python3 main.py --anomalies
python3 main.py --forecast
```

### 3. Run Streamlit GUI:
```bash
streamlit run app.py
```

### 4. Compile & Run C++ High-Speed Anomaly Engine:
```bash
g++ -O3 -std=c++17 anomaly_scanner.cpp -o anomaly_scanner
./anomaly_scanner
```

---

## 3. Test Cases & Verification Table

| Test ID | Description | Input | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Valid Expense | `2026-11-01`, `250`, `Food` | Saved with auto-increment ID | **PASS** |
| **TC-02** | Negative Amount | `-50.00`, `Food` | Raises `ValueError` | **PASS** |
| **TC-03** | Zero Amount | `0.00`, `Food` | Raises `ValueError` | **PASS** |
| **TC-04** | Invalid Date | `31-31-2026`, `100`, `Food` | Raises `ValueError` | **PASS** |
| **TC-05** | Unknown Category | `100`, `Gold` | Raises `ValueError` | **PASS** |
| **TC-06** | Budget Warning | Transport: 2100 / 2500 | Classified as `Warning` (84%) | **PASS** |
| **TC-07** | Budget Over | Shopping: 3500 / 3000 | Classified as `Over` (116.7%) | **PASS** |
| **TC-08** | Anomaly Z-Score | Food: ₹4,800 (norm: 80-450) | Flagged with Z > 2.0 | **PASS** |
| **TC-09** | Run-Rate Math | Day 5: ₹500 in 30-day month | Forecast = ₹3,000 | **PASS** |
| **TC-10** | CSV Roundtrip | Export 2 rows, clear, import | 2 rows restored, 0 errors | **PASS** |

---

## 4. Examiner Viva Voce Cheat Sheet

1. **Why SQLite?**
   - Embedded, zero-configuration database included in Python standard library. No server daemons or credentials required; ACID compliant; optimal for local and desktop applications. Easily scales to PostgreSQL for web production.
2. **How is SQL injection prevented?**
   - Never use string formatting (`f"INSERT INTO ... {val}"`). All queries use parameterized statements (`?` placeholders), guaranteeing parameters are escaped safely by the SQLite C engine.
3. **How does Z-score anomaly detection work?**
   - Computed within each individual category: `z = (x - mean) / std_dev`. Extreme transactions with `z > 2.0` (upper 2.5% tail) are flagged without false positives from high-ticket necessities like rent.
4. **How is month-end forecast computed?**
   - Linear run-rate projection: `(Spent so far / Days elapsed) * Days in month`. Simple, transparent, and requires no heavy machine learning training sets.
