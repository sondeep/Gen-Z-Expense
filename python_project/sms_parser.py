"""
sms_parser.py - Automated Bank & UPI SMS Transaction Ingestion Engine
Expense Tracker with Spending Insights
Course: B.Tech CSE, 2nd Year, Group 3G
Languages: Python 3.10+, SQLite, Regular Expressions
"""

import re
from datetime import datetime, date
from config import CATEGORIES, PAYMENT_MODES


# Merchant keyword to category mapping for automated classification
MERCHANT_CATEGORY_RULES = {
    "Food": [
        "swiggy", "zomato", "mcdonald", "starbucks", "domino", "burger", "pizza",
        "cafe", "chai", "tea", "canteen", "restaurant", "baker", "eats", "dine",
        "haldiram", "biryani", "dhaba"
    ],
    "Transport": [
        "uber", "ola", "rapido", "metro", "irctc", "rail", "redbus", "fuel",
        "petrol", "diesel", "hpcl", "bpcl", "ioc", "shell", "fastag", "toll", "auto"
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "ajio", "zara", "h&m", "retail", "croma",
        "reliance", "decathlon", "blinkit", "zepto", "instamart", "dmart", "store",
        "mart", "mall", "market"
    ],
    "Bills": [
        "airtel", "jio", "vodafone", "vi", "bescom", "electricity", "broadband",
        "wifi", "billdesk", "gas", "water", "utility", "tata power", "recharge",
        "dth", "dish tv"
    ],
    "Health": [
        "apollo", "pharmacy", "1mg", "pharmeasy", "medplus", "hospital", "clinic",
        "diagnostics", "lab", "dent", "dr.", "doctor", "health", "medical"
    ],
    "Entertainment": [
        "netflix", "spotify", "hotstar", "disney", "prime", "bookmyshow", "pvr",
        "inox", "cinema", "theatre", "steam", "playstation", "youtube", "game"
    ],
    "Rent": [
        "nobroker", "rent", "landlord", "pg", "hostel", "maintenance", "society"
    ]
}

# Known Indian banks and UPI service identifiers
KNOWN_BANKS = [
    "SBI", "HDFC", "ICICI", "AXIS", "KOTAK", "PUNJAB NATIONAL BANK", "PNB",
    "BANK OF BARODA", "BOB", "CANARA", "UNION BANK", "INDUSIND", "YES BANK",
    "FEDERAL BANK", "PAYTM", "PHONEPE", "GPAY", "GOOGLE PAY", "CRED"
]


def predict_category(merchant_text, note=""):
    """
    Predicts transaction category using keyword NLP heuristics.
    Returns (category, confidence_percentage).
    """
    combined = (merchant_text + " " + note).lower()

    for category, keywords in MERCHANT_CATEGORY_RULES.items():
        for kw in keywords:
            if kw in combined:
                return category, 95  # High confidence rule match

    # Default fallback
    return "Other", 50


def parse_bank_sms(sms_text):
    """
    Extracts structured transaction details from unstructured bank and UPI SMS texts.
    
    Supported formats include:
    - SBI, HDFC, ICICI, Axis, Kotak debit SMS alerts
    - UPI payments via Google Pay, PhonePe, Paytm, CRED
    - Card swipe and Net Banking debits

    Returns a dict with:
        amount (float), merchant (str), date (YYYY-MM-DD),
        payment_mode (str), bank (str), ref_no (str), category (str)
    """
    if not sms_text or not isinstance(sms_text, str):
        raise ValueError("Invalid SMS content: expected non-empty string")

    text = sms_text.strip()
    lower_text = text.lower()

    # Step 1: Verify this is an outgoing debit transaction (not credit/refund)
    debit_keywords = [
        "debited", "sent", "paid", "spent", "transferred", "deducted",
        "withdrawn", "payment of", "purchase of"
    ]
    is_debit = any(k in lower_text for k in debit_keywords)
    if not is_debit and "credited" in lower_text:
        raise ValueError("SMS represents an incoming credit, not an expense")

    # Step 2: Extract Amount (handles INR, Rs., Rs, ₹ with optional commas)
    # Examples: Rs. 450.00, INR 1,299.50, Rs 50, ₹320.00
    amount = None
    amt_pattern = r'(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)'
    match_amt = re.search(amt_pattern, text, re.IGNORECASE)
    if match_amt:
        raw_amt = match_amt.group(1).replace(",", "")
        amount = float(raw_amt)
    else:
        # Fallback: number followed by rs/inr
        fallback_amt = re.search(r'([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs|inr|₹)', text, re.IGNORECASE)
        if fallback_amt:
            amount = float(fallback_amt.group(1).replace(",", ""))

    if not amount or amount <= 0:
        raise ValueError("Could not extract a valid positive amount from SMS")

    # Step 3: Extract Merchant / Payee
    merchant = "Unknown Payee"
    # Matches patterns like: "to SWIGGY on", "to vpa john@upi", "at RELIANCE RETAIL", "info: UBER"
    merchant_patterns = [
        r'(?:to|at|info:?|towards)\s+([A-Za-z0-9\s@\.\-_&]+?)(?:\s+on|\s+ref|\s+upi|\s+avl|\s+bal|\s+via|\.|$|\n)',
        r'(?:vpa)\s+([A-Za-z0-9\.\-_@]+)',
    ]
    for pat in merchant_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            candidate = m.group(1).strip()
            # Clean up candidate
            candidate = re.sub(r'^(the|a)\s+', '', candidate, flags=re.IGNORECASE)
            if len(candidate) > 2 and len(candidate) < 40 and not any(k in candidate.lower() for k in ["ac", "a/c", "account"]):
                merchant = candidate
                break

    # Step 4: Extract Bank or Payment Provider
    bank = "Bank"
    for b in KNOWN_BANKS:
        if re.search(r'\b' + re.escape(b) + r'\b', text, re.IGNORECASE):
            bank = b
            break

    # Step 5: Detect Payment Mode (UPI vs Card vs Net Banking)
    mode = "UPI"
    if "upi" in lower_text or "@" in lower_text or "vpa" in lower_text:
        mode = "UPI"
    elif "card" in lower_text or "ending" in lower_text or "pos" in lower_text:
        mode = "Card"
    elif "net banking" in lower_text or "neft" in lower_text or "rtgs" in lower_text or "imps" in lower_text:
        mode = "Net Banking"
    elif "atm" in lower_text or "cash" in lower_text:
        mode = "Cash"

    # Step 6: Extract Reference / UTR Number
    ref_no = ""
    ref_match = re.search(r'(?:ref(?:\s*no)?\.?|utr|txn\s*id|id)\s*[:#-]?\s*([A-Za-z0-9]+)', text, re.IGNORECASE)
    if ref_match:
        ref_no = ref_match.group(1).strip()

    # Step 7: Extract or Default Transaction Date
    tx_date = date.today().strftime("%Y-%m-%d")
    date_match = re.search(r'(\d{1,2})[-/](\d{1,2}|[A-Za-z]{3})[-/](\d{2,4})', text)
    if date_match:
        try:
            raw_d = date_match.group(0)
            for fmt in ["%d-%m-%Y", "%d/%m/%Y", "%d-%b-%Y", "%d-%m-%y", "%d/%m/%y"]:
                try:
                    dt = datetime.strptime(raw_d, fmt).date()
                    tx_date = dt.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue
        except Exception:
            pass

    # Step 8: Auto-classify category using merchant keywords
    predicted_cat, confidence = predict_category(merchant, text)

    return {
        "amount": round(amount, 2),
        "merchant": merchant,
        "category": predicted_cat,
        "confidence": confidence,
        "payment_mode": mode,
        "bank": bank,
        "ref_no": ref_no,
        "date": tx_date,
        "raw_text": text
    }


def ingest_sms_to_db(sms_text):
    """
    Parses an incoming SMS message and saves it to the SQLite database
    using Member 1's add_expense pipeline.
    """
    from database import add_expense

    parsed = parse_bank_sms(sms_text)
    note = f"{parsed['merchant']} (via {parsed['bank']} SMS Ref: {parsed['ref_no']})".strip()
    
    exp_id = add_expense(
        day=parsed["date"],
        amount=parsed["amount"],
        category=parsed["category"],
        note=note,
        mode=parsed["payment_mode"]
    )
    parsed["id"] = exp_id
    return parsed


def parse_batch_bank_sms(batch_text):
    """
    Parses multiple SMS messages from a copied batch/inbox thread.
    Returns (success_list, failed_count).
    """
    chunks = re.split(r'(?:\r?\n\s*\r?\n)|(?:\n(?=(?:Sent|Dear|Rs|INR|HDFC|SBI|ICICI|Axis|Kotak|Paytm|PhonePe|A\/C)))', batch_text, flags=re.IGNORECASE)
    valid = []
    failed = 0
    for chunk in chunks:
        if not chunk or len(chunk.strip()) < 15:
            continue
        try:
            parsed = parse_bank_sms(chunk)
            valid.append(parsed)
        except Exception:
            failed += 1

    return valid, failed



# Sample real bank SMS fixtures for testing & presentation demonstration
SAMPLE_BANK_SMS = [
    {
        "bank": "Kotak / UPI",
        "category": "Food",
        "text": "Sent Rs. 350.00 from Kotak Bank AC X1234 to swiggy@icici on 08-11-2026 Ref 431289123891. Avl bal Rs 12,450.00."
    },
    {
        "bank": "SBI / UPI",
        "category": "Food",
        "text": "Dear SBI User, your A/C X9876 debited by Rs 1,499.00 on 08-Nov-2026 transfer to Zomato UPI ref 98127391."
    },
    {
        "bank": "HDFC / Card",
        "category": "Shopping",
        "text": "HDFC Bank: Rs 2,850.00 debited from a/c **4321 on 07-11-26 to RELIANCE RETAIL. Avl bal: Rs 45,210."
    },
    {
        "bank": "Paytm / UPI",
        "category": "Transport",
        "text": "Rs 120.00 paid to Uber India via Paytm UPI ref 589231 on 08-Nov-26. Updated balance: Rs 4,120."
    },
    {
        "bank": "ICICI / UPI",
        "category": "Entertainment",
        "text": "ICICI Bank Acct XX554 debited for INR 649.00 on 08-Nov-26 towards NETFLIX ENTERTAINMENT. UPI Ref 382910."
    },
    {
        "bank": "Axis / Net Banking",
        "category": "Bills",
        "text": "Axis Bank: INR 1,199.00 debited from A/c no. XX8901 on 08-11-2026 for Airtel Broadband Bill. Ref no 771928."
    },
    {
        "bank": "SBI / UPI",
        "category": "Health",
        "text": "A/C *5544 debited by INR 850.00 on 08-11-26 via UPI to APOLLO PHARMACY. Avl Bal INR 8,920. Ref 110928."
    }
]


if __name__ == "__main__":
    print("Testing Python SMS Parser with sample Indian bank messages:\n")
    for s in SAMPLE_BANK_SMS:
        try:
            res = parse_bank_sms(s["text"])
            print(f"Bank: {res['bank']:<10} | Amt: ₹{res['amount']:<8} | Cat: {res['category']:<12} ({res['confidence']}%) | Merchant: {res['merchant']}")
        except Exception as e:
            print(f"Error parsing: {e}")
