# Role 1: Backend Data Layer & Persistence (Member 1)

**Candidate/Owner**: Member 1  
**Project**: GenZ Expense Tracker with Spending Insights  
**Languages**: Python 3.10+, C (C99/C11), Modern C++ (C++17), SQLite  

---

## 1. Responsibilities & Deliverables
Member 1 is responsible for the foundational persistence and data validation layer of the GenZ Expense Tracker:
1. **Schema Design & Table Invariants**:
   - Primary `expenses` table with `id` (AUTOINCREMENT), `date` (ISO YYYY-MM-DD), `amount` (FLOAT with CHECK constraint `amount > 0`), `category`, `note`, `payment_mode`.
   - Category budget limit reference table with non-negative constraints.
2. **Strict Input Validations**:
   - Preventing negative or zero transactions across all three runtimes (Python, C, C++).
   - Validating dates strictly in ISO `YYYY-MM-DD` format (10 characters, valid delimiters, calendar range checking).
   - Rejecting non-standard categories; strictly enforcing the allowed enum.
3. **Prevention of SQL Injection**:
   - Guaranteeing that 100% of queries use parameterized `?` placeholders; zero SQL injection via string concatenation or f-strings.
4. **Persistence & Serialization**:
   - SQLite relational storage (`expenses.db`).
   - Bidirectional CSV serialization (`save_csv` / `load_csv`) for portability across native C, C++, and Python engines.
5. **Sample Data Generator**:
   - Seed engine producing realistic multi-category student transactions.

---

## 2. File Manifest

| Language | File | Description |
| :--- | :--- | :--- |
| **Python** | `database.py` | SQLite connection, table DDL, parameterized CRUD, CSV export/import, random transaction seeder. |
| **Python** | `config.py` | Central category lists, payment modes, default budget limits, threshold constants. |
| **C** | `data_layer.h` | C header defining `Expense`, `ExpenseBook`, category enums, and CRUD prototypes. |
| **C** | `data_layer.c` | Procedural ANSI C data layer, array boundary checks, CSV parser and serializer. |
| **C++** | `data_layer.hpp` | C++ header declaring `Expense` entity class and `ExpenseManager` storage repository. |
| **C++** | `data_layer.cpp` | C++17 implementation using STL vectors, RAII, exception handling (`std::invalid_argument`), and file streams. |

---

## 3. How to Execute & Verify Member 1 Code

### Python Data Layer:
```bash
# Seed 90 days of realistic sample transactions into SQLite:
python3 database.py
```

### C Data Layer:
```bash
# Compile and test C data module:
gcc -std=c11 -c data_layer.c -o data_layer.o
```

### C++ Data Layer:
```bash
# Compile C++ data module:
g++ -std=c++17 -c data_layer.cpp -o data_layer.o
```

---

## 4. Examiner Viva Voce Defense Points (Member 1)
- **Q: How did you ensure data integrity?**  
  *A*: Enforced at both application and database levels. In SQLite, table DDL includes `CHECK(amount > 0)` and `NOT NULL`. In C/C++, constructor and setter validations throw exceptions / return error codes before memory insertion.
- **Q: How does the system defend against SQL Injection?**  
  *A*: Never using string formatting or template literals. All values are bound as parameters via `?` placeholders passed directly to the SQLite C-engine prepared statements.
