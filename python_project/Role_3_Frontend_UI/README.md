# Role 3: Frontend User Interfaces & Data Ingestion (Member 3)

**Candidate/Owner**: Member 3  
**Project**: GenZ Expense Tracker with Spending Insights  
**Languages**: Python (Streamlit, Matplotlib), C++17 (SMS Tokenizer), TypeScript/React  

---

## 1. Responsibilities & Deliverables
Member 3 is responsible for creating intuitive, reactive user interfaces and automated data ingestion:
1. **Interactive Dashboard**:
   - Streamlit frontend (`app.py`) featuring tabbed navigation: Quick Spend, Transaction History, Budget Health, and Velocity Insights.
2. **Visualizations**:
   - Matplotlib charts (`charts.py`): Pie charts with exploded callouts for category distribution, and monthly trend bar charts with safe-to-spend benchmarks.
3. **Automated Bank SMS Ingestion**:
   - Regular expression parsing engine (`sms_parser.py`) supporting Indian banking SMS templates (HDFC, SBI, ICICI, Axis, Paytm, PhonePe, Google Pay).
   - Auto-extracts amount, merchant/vendor name, payment channel, and maps vendor keywords to standard categories.
4. **C++ Native Tokenizer Accelerator**:
   - `sms_tokenizer.cpp`: Ultra-fast C++17 zero-heap token extractor designed for embedded mobile/telecom background daemons.

---

## 2. File Manifest

| Language | File | Description |
| :--- | :--- | :--- |
| **Python** | `app.py` | Streamlit reactive web application with interactive widgets, transaction logs, and budget health alerts. |
| **Python** | `charts.py` | Matplotlib visualization engine generating donut charts, pie charts, and monthly trend graphs. |
| **Python** | `sms_parser.py` | Regex and heuristic engine extracting banking transactions from SMS notifications into SQLite. |
| **C++** | `sms_tokenizer.cpp` | Zero-allocation C++17 fast text scanner extracting transaction amounts and merchants in <1 microsecond. |
| **React / TS** | `../../src/*` | Full-stack interactive React + Tailwind CSS web dashboard running on port 3000. |

---

## 3. How to Execute & Verify Member 3 Code

### Streamlit GUI:
```bash
streamlit run app.py
```

### Bank SMS Ingestion Demonstration:
```bash
python3 -c "
from sms_parser import parse_bank_sms, SAMPLE_BANK_SMS
for s in SAMPLE_BANK_SMS[:2]:
    print(parse_bank_sms(s))
"
```

### C++ Native Tokenizer:
```bash
g++ -std=c++17 -O2 sms_tokenizer.cpp -o sms_tokenizer
./sms_tokenizer
```

---

## 4. Examiner Viva Voce Defense Points (Member 3)
- **Q: How does the SMS parser classify expenses without machine learning?**  
  *A*: Uses deterministic regex patterns to capture currency amounts (`INR`, `Rs.`, `₹`), identifies debit verbs (`debited`, `spent`, `paid`), and matches merchant tokens against a high-confidence semantic dictionary (`swiggy` -> Food, `uber` -> Transport, `amazon` -> Shopping).
- **Q: Why provide both a Web UI and a CLI fallback?**  
  *A*: Production applications require high accessibility. The GUI caters to visual daily tracking, while the CLI/C++ engines enable automated batch scripting, server automation, and execution on headless embedded environments.
