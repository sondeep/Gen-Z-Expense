import { Expense, Budget, BudgetStatusRow, AnomalyExpense, Subscription, SavingsGoal, FinancialHealth } from '../types/project';

export const CATEGORIES = [
  'Food',
  'Transport',
  'Rent',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Books',
  'Other',
] as const;

export const CATEGORY_ALIASES: Record<string, Category> = {
  Travel: 'Transport',
  Fun: 'Entertainment',
  Education: 'Books',
};

export type Category = typeof CATEGORIES[number];

export const PAYMENT_MODES = ['UPI', 'Card', 'Cash', 'Net Banking'] as const;
export type PaymentMode = typeof PAYMENT_MODES[number];

export const DEFAULT_BUDGETS: Record<string, number> = {
  Food: 6000,
  Transport: 2500,
  Shopping: 3000,
  Entertainment: 2000,
  Bills: 2500,
  Health: 2000,
  Rent: 9000,
  Other: 1500,
};

export const WARNING_PCT = 80; // budget usage >= 80% shows Warning
export const ANOMALY_Z = 2.0; // z-score > 2.0 flags unusual spend

export const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub-1', name: 'Netflix Premium', amount: 649, category: 'Entertainment', frequency: 'monthly', dayOfMonth: 8, payment_mode: 'UPI', isActive: true },
  { id: 'sub-2', name: 'Spotify Individual', amount: 119, category: 'Entertainment', frequency: 'monthly', dayOfMonth: 15, payment_mode: 'Card', isActive: true },
  { id: 'sub-3', name: 'Airtel Broadband Fiber', amount: 1179, category: 'Bills', frequency: 'monthly', dayOfMonth: 5, payment_mode: 'UPI', isActive: true },
  { id: 'sub-4', name: 'Hostel / Flat Rent', amount: 9000, category: 'Rent', frequency: 'monthly', dayOfMonth: 1, payment_mode: 'Net Banking', isActive: true },
];

export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [
  { id: 'goal-1', name: 'Emergency Rainy Day Fund', targetAmount: 25000, currentAmount: 14500, targetDate: '2027-03-31', emoji: '🛡️' },
  { id: 'goal-2', name: 'Mechanical Keyboard & Desk Setup', targetAmount: 8500, currentAmount: 6200, targetDate: '2026-12-31', emoji: '⌨️' },
  { id: 'goal-3', name: 'Weekend Trip with College Friends', targetAmount: 5000, currentAmount: 3100, targetDate: '2027-01-15', emoji: '🏖️' },
];

export class ExpenseDatabase {
  private expenses: Expense[] = [];
  private budgets: Record<string, number> = { ...DEFAULT_BUDGETS };
  private subscriptions: Subscription[] = [...DEFAULT_SUBSCRIPTIONS];
  private savingsGoals: SavingsGoal[] = [...DEFAULT_SAVINGS_GOALS];
  private nextId = 1;

  constructor(seedSample = true) {
    if (seedSample) {
      this.seedData(90);
    }
  }

  // Subscriptions management
  public getSubscriptions(): Subscription[] {
    return [...this.subscriptions];
  }

  public addSubscription(sub: Omit<Subscription, 'id'>): Subscription {
    const newSub: Subscription = {
      ...sub,
      id: `sub-${Date.now()}`,
    };
    this.subscriptions.push(newSub);
    return newSub;
  }

  public toggleSubscription(id: string): void {
    const target = this.subscriptions.find(s => s.id === id);
    if (target) {
      target.isActive = !target.isActive;
    }
  }

  public deleteSubscription(id: string): void {
    this.subscriptions = this.subscriptions.filter(s => s.id !== id);
  }

  // Savings Goals management
  public getSavingsGoals(): SavingsGoal[] {
    return [...this.savingsGoals];
  }

  public addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): SavingsGoal {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
    };
    this.savingsGoals.push(newGoal);
    return newGoal;
  }

  public depositToGoal(id: string, amount: number): boolean {
    const target = this.savingsGoals.find(g => g.id === id);
    if (target && amount > 0) {
      target.currentAmount = Math.min(target.targetAmount, target.currentAmount + amount);
      return true;
    }
    return false;
  }

  public deleteSavingsGoal(id: string): void {
    this.savingsGoals = this.savingsGoals.filter(g => g.id !== id);
  }

  // Role 1: Data validation & CRUD
  public normalizeCategory(cat: string): string {
    const trimmed = cat.trim();
    if (CATEGORY_ALIASES[trimmed]) {
      return CATEGORY_ALIASES[trimmed];
    }
    return trimmed;
  }

  public validate(day: string, amount: number, category: string): string {
    if (amount <= 0 || isNaN(amount)) {
      throw new Error('Amount must be positive (got ' + amount + ')');
    }
    const normalizedCat = this.normalizeCategory(category);
    if (!CATEGORIES.includes(normalizedCat as Category)) {
      throw new Error(`Unknown category: ${category}. Allowed: ${CATEGORIES.join(', ')}`);
    }
    const parsedDate = new Date(day);
    if (isNaN(parsedDate.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      throw new Error(`Invalid date format: ${day}. Expected YYYY-MM-DD`);
    }
    return normalizedCat;
  }

  public addExpense(
    day: string,
    amount: number,
    category: string,
    note = '',
    mode: PaymentMode = 'UPI'
  ): Expense {
    const finalCat = this.validate(day, amount, category);

    const expense: Expense = {
      id: this.nextId++,
      date: day,
      amount: Math.round(amount * 100) / 100,
      category: finalCat,
      note: note.trim(),
      payment_mode: mode,
    };

    this.expenses.push(expense);
    return expense;
  }

  public deleteExpense(id: number): boolean {
    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.expenses.splice(idx, 1);
      return true;
    }
    return false;
  }

  public getExpenses(start?: string, end?: string): Expense[] {
    let result = [...this.expenses];
    if (start) {
      result = result.filter(e => e.date >= start);
    }
    if (end) {
      result = result.filter(e => e.date <= end);
    }
    return result.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }

  public setBudget(category: string, limit: number): void {
    if (limit <= 0 || isNaN(limit)) {
      throw new Error('Monthly limit must be greater than 0');
    }
    this.budgets[category] = Math.round(limit);
  }

  public getBudgets(): Record<string, number> {
    return { ...this.budgets };
  }

  public clear(): void {
    this.expenses = [];
    this.nextId = 1;
  }

  public clearAllExpenses(): void {
    this.clear();
  }

  // Role 1: Sample Data Generator
  public seedData(days = 90): void {
    this.clear();
    const today = new Date();
    const ranges: Record<string, [number, number]> = {
      Food: [80, 450],
      Transport: [30, 300],
      Shopping: [300, 2800],
      Bills: [200, 1500],
      Entertainment: [150, 1200],
      Health: [100, 1400],
      Other: [50, 400],
    };

    // Deterministic pseudo-random sequence for repeatability
    let seed = 42;
    const pseudoRand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const categoriesList = Object.keys(ranges);

    for (let i = days; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const isoDate = d.toISOString().slice(0, 10);
      const dayOfMonth = d.getDate();

      // Add rent on the 1st of each month
      if (dayOfMonth === 1) {
        this.addExpense(isoDate, 9000, 'Rent', 'Monthly rent hostel/flat', 'Net Banking');
      }

      // 1 to 3 regular transactions per day
      const count = 1 + Math.floor(pseudoRand() * 2.5);
      for (let c = 0; c < count; c++) {
        const catIdx = Math.floor(pseudoRand() * categoriesList.length);
        const cat = categoriesList[catIdx];
        const [min, max] = ranges[cat];
        const amt = Math.round(min + pseudoRand() * (max - min));
        const mode = PAYMENT_MODES[Math.floor(pseudoRand() * PAYMENT_MODES.length)];
        this.addExpense(isoDate, amt, cat, `Sample ${cat.toLowerCase()}`, mode);
      }
    }

    // Explicit anomaly insertion in recent week to demonstrate Z-score detection in Member 2 engine
    const recentDate = new Date(today.getTime() - 3 * 86400000).toISOString().slice(0, 10);
    this.addExpense(recentDate, 4800, 'Food', 'High-end team dinner & treat (Anomaly!)', 'Card');
    const recentShopDate = new Date(today.getTime() - 8 * 86400000).toISOString().slice(0, 10);
    this.addExpense(recentShopDate, 9200, 'Shopping', 'Mechanical Keyboard & Monitor (Anomaly!)', 'UPI');
  }

  // Role 1: CSV Export & Import
  public exportCSV(): string {
    const headers = ['id', 'date', 'amount', 'category', 'note', 'payment_mode'];
    const rows = this.expenses.map(e =>
      [e.id, e.date, e.amount, `"${e.category}"`, `"${e.note.replace(/"/g, '""')}"`, e.payment_mode].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  public importCSV(csvContent: string): { imported: number; errors: string[] } {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      return { imported: 0, errors: ['CSV file is empty or missing data rows'] };
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const dateIdx = header.indexOf('date');
    const amountIdx = header.indexOf('amount');
    const catIdx = header.indexOf('category');
    const noteIdx = header.indexOf('note');
    const modeIdx = header.indexOf('payment_mode');

    if (dateIdx === -1 || amountIdx === -1 || catIdx === -1) {
      return {
        imported: 0,
        errors: ['CSV must contain at least "date", "amount", and "category" columns'],
      };
    }

    let imported = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // simple CSV regex parser
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

      try {
        const rawDate = cleanCols[dateIdx];
        const rawAmt = parseFloat(cleanCols[amountIdx]);
        const rawCat = cleanCols[catIdx];
        const rawNote = noteIdx !== -1 && cleanCols[noteIdx] ? cleanCols[noteIdx] : '';
        const rawMode = (modeIdx !== -1 && cleanCols[modeIdx] ? cleanCols[modeIdx] : 'UPI') as PaymentMode;

        this.addExpense(rawDate, rawAmt, rawCat, rawNote, PAYMENT_MODES.includes(rawMode) ? rawMode : 'UPI');
        imported++;
      } catch (err: unknown) {
        errors.push(`Row ${i + 1}: ${(err as Error).message}`);
      }
    }

    return { imported, errors };
  }
}

// Role 2: Analytics Engine (Functional & pure for easy testing)
export function getCategorySummary(expenses: Expense[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const exp of expenses) {
    summary[exp.category] = (summary[exp.category] || 0) + exp.amount;
  }
  return summary;
}

export function getMonthlyTrend(expenses: Expense[]): Record<string, number> {
  const trend: Record<string, number> = {};
  for (const exp of expenses) {
    const month = exp.date.slice(0, 7); // YYYY-MM
    trend[month] = (trend[month] || 0) + exp.amount;
  }
  return trend;
}

export function getCurrentMonthExpenses(expenses: Expense[], targetMonth?: string): Expense[] {
  if (!expenses.length) return [];
  const month = targetMonth || expenses.reduce((max, e) => (e.date > max ? e.date : max), expenses[0].date).slice(0, 7);
  return expenses.filter(e => e.date.startsWith(month));
}

export function getBudgetStatus(
  expenses: Expense[],
  budgets: Record<string, number>,
  targetMonth?: string
): BudgetStatusRow[] {
  const curMonthExpenses = getCurrentMonthExpenses(expenses, targetMonth);
  const spentByCat: Record<string, number> = {};

  for (const exp of curMonthExpenses) {
    spentByCat[exp.category] = (spentByCat[exp.category] || 0) + exp.amount;
  }

  const rows: BudgetStatusRow[] = [];
  for (const [category, limit] of Object.entries(budgets)) {
    const spent = Math.round((spentByCat[category] || 0) * 100) / 100;
    const used_pct = limit > 0 ? Math.round((spent / limit) * 1000) / 10 : 0;
    let status: 'OK' | 'Warning' | 'Over' = 'OK';
    if (spent > limit) {
      status = 'Over';
    } else if (used_pct >= WARNING_PCT) {
      status = 'Warning';
    }

    rows.push({
      category,
      spent,
      limit,
      used_pct,
      status,
    });
  }

  // Sort descending by used percentage
  return rows.sort((a, b) => b.used_pct - a.used_pct);
}

export function getTopSpends(expenses: Expense[], n = 5): Expense[] {
  return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, n);
}

/**
 * Role 2 Z-score Anomaly Detection
 * Formula: z = (amount - mean_category) / std_category
 * Flags transactions where z > ANOMALY_Z (default 2.0)
 */
export function detectAnomalies(expenses: Expense[], threshold = ANOMALY_Z): AnomalyExpense[] {
  // Group by category
  const catGroups: Record<string, Expense[]> = {};
  for (const exp of expenses) {
    if (!catGroups[exp.category]) catGroups[exp.category] = [];
    catGroups[exp.category].push(exp);
  }

  const anomalies: AnomalyExpense[] = [];

  for (const [, group] of Object.entries(catGroups)) {
    if (group.length < 3) continue; // Need at least 3 points for meaningful std dev

    const amounts = group.map(g => g.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (amounts.length - 1);
    const std = Math.sqrt(variance);

    if (std === 0) continue; // No variation

    for (const exp of group) {
      const zScore = (exp.amount - mean) / std;
      if (zScore > threshold) {
        anomalies.push({
          ...exp,
          mean: Math.round(mean * 10) / 10,
          std: Math.round(std * 10) / 10,
          zScore: Math.round(zScore * 100) / 100,
        });
      }
    }
  }

  return anomalies.sort((a, b) => b.zScore - a.zScore);
}

/**
 * Role 2 Month-End Run-Rate Forecast
 * Formula: month_end_forecast = (spent_so_far / days_elapsed) * days_in_month
 */
export function calculateMonthEndForecast(
  expenses: Expense[],
  referenceDate?: Date
): {
  spentSoFar: number;
  daysElapsed: number;
  daysInMonth: number;
  forecastTotal: number;
  dailyRunRate: number;
} {
  const ref = referenceDate || new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const currentExpenses = expenses.filter(e => e.date.startsWith(monthPrefix));
  const spentSoFar = currentExpenses.reduce((t, e) => t + e.amount, 0);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = Math.max(1, ref.getDate());

  const dailyRunRate = spentSoFar / daysElapsed;
  const forecastTotal = Math.round(dailyRunRate * daysInMonth);

  return {
    spentSoFar,
    daysElapsed,
    daysInMonth,
    forecastTotal,
    dailyRunRate: Math.round(dailyRunRate * 10) / 10,
  };
}

export interface ParsedSmsResult {
  amount: number;
  merchant: string;
  category: string;
  confidence: number;
  payment_mode: 'UPI' | 'Card' | 'Cash' | 'Net Banking';
  bank: string;
  ref_no: string;
  date: string;
  raw_text: string;
}

const SMS_CATEGORY_RULES: Record<string, string[]> = {
  Food: ['swiggy', 'zomato', 'mcdonald', 'starbucks', 'domino', 'burger', 'pizza', 'cafe', 'chai', 'tea', 'canteen', 'restaurant', 'eats', 'biryani'],
  Transport: ['uber', 'ola', 'rapido', 'metro', 'irctc', 'rail', 'fuel', 'petrol', 'diesel', 'hpcl', 'bpcl', 'shell', 'fastag', 'toll', 'auto'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'zara', 'retail', 'croma', 'reliance', 'decathlon', 'blinkit', 'zepto', 'instamart', 'dmart', 'mart'],
  Bills: ['airtel', 'jio', 'vodafone', 'vi', 'bescom', 'electricity', 'broadband', 'wifi', 'billdesk', 'gas', 'water', 'recharge', 'dth'],
  Health: ['apollo', 'pharmacy', '1mg', 'pharmeasy', 'medplus', 'hospital', 'clinic', 'diagnostics', 'doctor', 'health', 'medical'],
  Entertainment: ['netflix', 'spotify', 'hotstar', 'disney', 'prime', 'bookmyshow', 'pvr', 'inox', 'cinema', 'theatre', 'steam', 'game'],
  Rent: ['nobroker', 'rent', 'landlord', 'pg', 'hostel', 'maintenance', 'society'],
};

const SMS_BANKS = ['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK', 'PNB', 'PAYTM', 'PHONEPE', 'GPAY', 'CRED'];

export function parseBankSms(text: string): ParsedSmsResult {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid SMS text provided');
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Debit check
  const debitWords = ['debited', 'sent', 'paid', 'spent', 'transferred', 'deducted', 'withdrawn', 'payment'];
  const isDebit = debitWords.some(w => lower.includes(w));
  if (!isDebit && lower.includes('credited')) {
    throw new Error('This SMS is an incoming credit, not an expenditure.');
  }

  // 2. Amount regex
  let amount = 0;
  const match = clean.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i) || clean.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:rs|inr|₹)/i);
  if (match) {
    amount = parseFloat(match[1].replace(/,/g, ''));
  }

  if (!amount || amount <= 0 || isNaN(amount)) {
    throw new Error('Could not identify a valid positive amount in this SMS.');
  }

  // 3. Merchant extraction
  let merchant = 'Unknown Merchant';
  const merchMatch = clean.match(/(?:to|at|towards|info:?)\s+([A-Za-z0-9\s@\.\-_&]+?)(?:\s+on|\s+ref|\s+upi|\s+avl|\s+bal|\s+via|\.|$|\n)/i);
  if (merchMatch) {
    const candidate = merchMatch[1].trim().replace(/^(the|a)\s+/i, '');
    if (candidate.length > 2 && candidate.length < 35 && !/a\/c|account/i.test(candidate)) {
      merchant = candidate;
    }
  }

  // 4. Bank extraction
  let bank = 'Bank';
  for (const b of SMS_BANKS) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(clean)) {
      bank = b;
      break;
    }
  }

  // 5. Payment Mode
  let mode: 'UPI' | 'Card' | 'Cash' | 'Net Banking' = 'UPI';
  if (lower.includes('upi') || lower.includes('@') || lower.includes('vpa')) {
    mode = 'UPI';
  } else if (lower.includes('card') || lower.includes('pos') || lower.includes('ending')) {
    mode = 'Card';
  } else if (lower.includes('net banking') || lower.includes('neft') || lower.includes('imps')) {
    mode = 'Net Banking';
  }

  // 6. Ref / UTR
  let ref_no = '';
  const refMatch = clean.match(/(?:ref(?:\s*no)?\.?|utr|txn\s*id|id)\s*[:#-]?\s*([A-Za-z0-9]+)/i);
  if (refMatch) {
    ref_no = refMatch[1].trim();
  }

  // 7. Date
  let txDate = new Date().toISOString().slice(0, 10);
  const dateMatch = clean.match(/(\d{1,2})[-/](\d{1,2}|[A-Za-z]{3})[-/](\d{2,4})/);
  if (dateMatch) {
    // Keep today if parsing fails
  }

  // 8. Auto category
  let category = 'Other';
  let confidence = 50;
  const combined = (merchant + ' ' + clean).toLowerCase();

  for (const [cat, keywords] of Object.entries(SMS_CATEGORY_RULES)) {
    if (keywords.some(k => combined.includes(k))) {
      category = cat;
      confidence = 95;
      break;
    }
  }

  return {
    amount: Math.round(amount * 100) / 100,
    merchant,
    category,
    confidence,
    payment_mode: mode,
    bank,
    ref_no,
    date: txDate,
    raw_text: clean,
  };
}

export const SAMPLE_BANK_SMS_FIXTURES: { bank: string; category: string; text: string }[] = [
  {
    bank: 'Kotak Bank (UPI)',
    category: 'Food',
    text: 'Sent Rs. 350.00 from Kotak Bank AC X1234 to swiggy@icici on 08-11-2026 Ref 431289123891. Avl bal Rs 12,450.00.',
  },
  {
    bank: 'SBI Bank (UPI)',
    category: 'Food',
    text: 'Dear SBI User, your A/C X9876 debited by Rs 1,499.00 on 08-Nov-2026 transfer to Zomato UPI ref 98127391.',
  },
  {
    bank: 'HDFC Bank (Card)',
    category: 'Shopping',
    text: 'HDFC Bank: Rs 2,850.00 debited from a/c **4321 on 07-11-26 to RELIANCE RETAIL. Avl bal: Rs 45,210.',
  },
  {
    bank: 'Paytm (UPI)',
    category: 'Transport',
    text: 'Rs 120.00 paid to Uber India via Paytm UPI ref 589231 on 08-Nov-26. Updated balance: Rs 4,120.',
  },
  {
    bank: 'ICICI Bank (UPI)',
    category: 'Entertainment',
    text: 'ICICI Bank Acct XX554 debited for INR 649.00 on 08-Nov-26 towards NETFLIX ENTERTAINMENT. UPI Ref 382910.',
  },
  {
    bank: 'Axis Bank (Net Banking)',
    category: 'Bills',
    text: 'Axis Bank: INR 1,199.00 debited from A/c no. XX8901 on 08-11-2026 for Airtel Broadband Bill. Ref no 771928.',
  },
  {
    bank: 'SBI (Health UPI)',
    category: 'Health',
    text: 'A/C *5544 debited by INR 850.00 on 08-11-26 via UPI to APOLLO PHARMACY. Avl Bal INR 8,920. Ref 110928.',
  },
];

/**
 * Industry-grade Financial Health Score (0 - 100)
 * Evaluates budget discipline, projection run-rate, outlier shocks, and daily pace.
 */
export function calculateFinancialHealth(
  expenses: Expense[],
  budgets: Record<string, number>,
  forecast: { spentSoFar: number; daysElapsed: number; daysInMonth: number; forecastTotal: number; dailyRunRate: number },
  anomalies: AnomalyExpense[]
): FinancialHealth {
  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  if (totalBudget === 0) {
    return {
      score: 75,
      grade: 'Good',
      title: 'Stable Setup',
      summary: 'Set category monthly budgets to get a granular financial health score.',
      tips: ['Configure category budgets under the Budgets tab.'],
    };
  }

  let baseScore = 100;
  const tips: string[] = [];

  // 1. Budget Run-Rate factor (-35 max)
  const projectionRatio = forecast.forecastTotal / totalBudget;
  if (projectionRatio > 1.3) {
    baseScore -= 35;
    tips.push(`At your current burn rate (₹${forecast.dailyRunRate.toFixed(0)}/day), you are projected to exceed your monthly budget by ₹${Math.round(forecast.forecastTotal - totalBudget).toLocaleString('en-IN')}.`);
  } else if (projectionRatio > 1.1) {
    baseScore -= 20;
    tips.push(`Spending pace is slightly higher than planned. Slow daily discretionary spend to stay green.`);
  } else if (projectionRatio > 0.95) {
    baseScore -= 10;
  } else {
    tips.push(`Great discipline: Your month-end forecast is ₹${Math.round(totalBudget - forecast.forecastTotal).toLocaleString('en-IN')} below your budget ceiling.`);
  }

  // 2. Category status penalties
  const status = getBudgetStatus(expenses, budgets);
  const overCats = status.filter(s => s.status === 'Over');
  const warnCats = status.filter(s => s.status === 'Warning');

  if (overCats.length > 0) {
    baseScore -= Math.min(25, overCats.length * 12);
    tips.push(`Over budget in ${overCats.map(c => c.category).join(', ')}. Review non-essential spending.`);
  }
  if (warnCats.length > 0) {
    baseScore -= Math.min(15, warnCats.length * 5);
    tips.push(`Watch out: ${warnCats.map(c => c.category).join(', ')} is past 80% usage.`);
  }

  // 3. Anomaly penalty
  if (anomalies.length > 0) {
    const penalty = Math.min(18, anomalies.length * 6);
    baseScore -= penalty;
    tips.push(`${anomalies.length} statistical anomaly detected (e.g. ₹${anomalies[0].amount.toLocaleString('en-IN')} on ${anomalies[0].category}).`);
  }

  const finalScore = Math.max(15, Math.min(100, Math.round(baseScore)));

  let grade: 'Excellent' | 'Good' | 'Attention' | 'At Risk' = 'Excellent';
  let title = 'Financial Mastery';
  let summary = 'Your cashflow run-rate and category limits are in pristine condition.';

  if (finalScore >= 85) {
    grade = 'Excellent';
    title = 'Pragmatic & In Control';
    summary = 'Outstanding financial discipline. Safe spending runway remains strong.';
  } else if (finalScore >= 70) {
    grade = 'Good';
    title = 'Healthy Financial Runway';
    summary = 'Solid spending habits with minor headroom to optimize high-burn categories.';
  } else if (finalScore >= 50) {
    grade = 'Attention';
    title = 'Needs Caution';
    summary = 'Approaching or exceeding budget thresholds in critical categories.';
  } else {
    grade = 'At Risk';
    title = 'Budget Overrun Alert';
    summary = 'Immediate slowdown recommended to prevent severe month-end deficit.';
  }

  return {
    score: finalScore,
    grade,
    title,
    summary,
    tips: tips.slice(0, 3),
  };
}

/**
 * Batch Bank SMS Parser
 * Parses multiline SMS pastes containing multiple transaction alerts.
 */
export function parseBatchBankSms(rawBatch: string): {
  success: ParsedSmsResult[];
  failedCount: number;
} {
  // Split on double newlines or lines starting with known bank names/keywords
  const chunks = rawBatch
    .split(/(?:\r?\n\s*\r?\n)|(?:\n(?=(?:Sent|Dear|Rs|INR|HDFC|SBI|ICICI|Axis|Kotak|Paytm|PhonePe|A\/C)))/gi)
    .map(c => c.trim())
    .filter(c => c.length > 15);

  const success: ParsedSmsResult[] = [];
  let failedCount = 0;

  for (const chunk of chunks) {
    try {
      const parsed = parseBankSms(chunk);
      success.push(parsed);
    } catch {
      failedCount++;
    }
  }

  return { success, failedCount };
}

/**
 * Auto-detect recurring subscriptions from past expense patterns
 */
export function detectSubscriptionsFromHistory(expenses: Expense[]): {
  name: string;
  category: string;
  amount: number;
  occurrences: number;
  averageDayOfMonth: number;
}[] {
  // Group by (category + note normalized)
  const groups: Record<string, Expense[]> = {};
  for (const e of expenses) {
    const key = `${e.category}::${(e.note || '').toLowerCase().trim()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }

  const detected: {
    name: string;
    category: string;
    amount: number;
    occurrences: number;
    averageDayOfMonth: number;
  }[] = [];

  for (const [key, list] of Object.entries(groups)) {
    if (list.length >= 2) {
      const [category, note] = key.split('::');
      const amounts = list.map(l => l.amount);
      const isConsistent = amounts.every(a => Math.abs(a - amounts[0]) <= 50);
      if (isConsistent && note.length > 2) {
        const avgDay = Math.round(list.reduce((sum, e) => sum + parseInt(e.date.slice(8, 10), 10), 0) / list.length);
        detected.push({
          name: list[0].note || category,
          category,
          amount: amounts[0],
          occurrences: list.length,
          averageDayOfMonth: avgDay,
        });
      }
    }
  }

  return detected.sort((a, b) => b.amount - a.amount);
}

export interface SmartQuickSpend {
  label: string;
  amount: number;
  category: Category;
  note: string;
  emoji: string;
  frequency: number;
}

/**
 * Dynamically analyzes user expense history to detect frequent habitual spends,
 * clusters by merchant/keyword, computes the median typical spend, and generates top 5 smart quick spend options.
 */
export function generateSmartQuickSpends(expenses: Expense[]): SmartQuickSpend[] {
  if (!expenses || expenses.length === 0) {
    return [
      { label: 'Chai / Coffee', amount: 20, category: 'Food', note: 'Chai / Coffee break', emoji: '☕', frequency: 1 },
      { label: 'Metro / Auto', amount: 50, category: 'Transport', note: 'Daily commute', emoji: '🚇', frequency: 1 },
      { label: 'Lunch / Snacks', amount: 150, category: 'Food', note: 'Lunch', emoji: '🍜', frequency: 1 },
      { label: 'Groceries', amount: 350, category: 'Shopping', note: 'Groceries', emoji: '🛒', frequency: 1 },
      { label: 'Petrol / Fuel', amount: 300, category: 'Transport', note: 'Vehicle fuel', emoji: '⛽', frequency: 1 },
    ];
  }

  const HABIT_PATTERNS: Array<{
    keywords: string[];
    label: string;
    category: Category;
    emoji: string;
    defaultNote: string;
  }> = [
    { keywords: ['chai', 'tea', 'coffee', 'starbucks', 'cafe', 'ccd'], label: 'Chai / Coffee', category: 'Food', emoji: '☕', defaultNote: 'Chai / Coffee break' },
    { keywords: ['metro', 'auto', 'uber', 'ola', 'cab', 'rapido', 'commute'], label: 'Metro / Cab Ride', category: 'Transport', emoji: '🚇', defaultNote: 'Daily commute' },
    { keywords: ['swiggy', 'zomato', 'eats', 'dinner', 'lunch', 'samosa', 'snack', 'restaurant', 'mcdonalds', 'kfc', 'burger'], label: 'Food Delivery / Dining', category: 'Food', emoji: '🍜', defaultNote: 'Food & Dining' },
    { keywords: ['grocery', 'groceries', 'blinkit', 'zepto', 'instamart', 'bigbasket', 'dmart', 'vegetable', 'fruit', 'milk'], label: 'Groceries', category: 'Shopping', emoji: '🛒', defaultNote: 'Groceries & provisions' },
    { keywords: ['petrol', 'fuel', 'diesel', 'cng', 'shell', 'hpcl', 'bpcl', 'ioc', 'indian oil'], label: 'Petrol / Fuel', category: 'Transport', emoji: '⛽', defaultNote: 'Vehicle fuel' },
    { keywords: ['pharmacy', 'apollo', 'medicine', 'medplus', 'doctor', 'clinic', 'hospital'], label: 'Pharmacy / Health', category: 'Health', emoji: '💊', defaultNote: 'Medicines & Health' },
    { keywords: ['amazon', 'flipkart', 'myntra', 'zara', 'shopping', 'lifestyle'], label: 'Shopping', category: 'Shopping', emoji: '🛍️', defaultNote: 'Shopping' },
    { keywords: ['netflix', 'spotify', 'hotstar', 'prime', 'cinema', 'pvr', 'movie'], label: 'Entertainment', category: 'Entertainment', emoji: '🎬', defaultNote: 'Entertainment' },
    { keywords: ['electricity', 'water', 'gas', 'broadband', 'wifi', 'recharge', 'jio', 'airtel'], label: 'Utility Bill', category: 'Bills', emoji: '⚡', defaultNote: 'Bill payment' },
  ];

  interface Cluster {
    label: string;
    category: Category;
    emoji: string;
    amounts: number[];
    notes: string[];
  }

  const clusters = new Map<string, Cluster>();

  for (const exp of expenses) {
    const rawNote = (exp.note || '').toLowerCase();
    const cleanNote = (exp.note || '').replace(/\s*\([^)]*\)/g, '').trim();

    let matched = false;
    for (const pat of HABIT_PATTERNS) {
      if (pat.keywords.some(kw => rawNote.includes(kw))) {
        matched = true;
        const existing: Cluster = clusters.get(pat.label) || {
          label: pat.label,
          category: pat.category,
          emoji: pat.emoji,
          amounts: [] as number[],
          notes: [] as string[],
        };
        existing.amounts.push(exp.amount);
        if (cleanNote) existing.notes.push(cleanNote);
        clusters.set(pat.label, existing);
        break;
      }
    }

    if (!matched && cleanNote.length >= 2) {
      const words = cleanNote.split(' ');
      const key = words.length > 1 ? `${words[0]} ${words[1]}` : words[0];
      const existing: Cluster = clusters.get(key) || {
        label: key,
        category: exp.category as Category,
        emoji: '💳',
        amounts: [] as number[],
        notes: [] as string[],
      };
      existing.amounts.push(exp.amount);
      existing.notes.push(cleanNote);
      clusters.set(key, existing);
    }
  }

  const result: SmartQuickSpend[] = [];

  for (const cluster of clusters.values()) {
    if (cluster.amounts.length === 0) continue;
    const sorted = [...cluster.amounts].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const typicalAmount = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    const note = cluster.notes[0] || cluster.label;

    result.push({
      label: cluster.label,
      amount: typicalAmount,
      category: cluster.category,
      note,
      emoji: cluster.emoji,
      frequency: cluster.amounts.length,
    });
  }

  // Sort by frequency (most habit-driven first) and take top 5
  result.sort((a, b) => b.frequency - a.frequency);

  if (result.length === 0) {
    return [
      { label: 'Chai / Coffee', amount: 20, category: 'Food', note: 'Chai / Coffee break', emoji: '☕', frequency: 1 },
      { label: 'Metro / Auto', amount: 50, category: 'Transport', note: 'Daily commute', emoji: '🚇', frequency: 1 },
      { label: 'Lunch / Snacks', amount: 150, category: 'Food', note: 'Lunch', emoji: '🍜', frequency: 1 },
      { label: 'Groceries', amount: 350, category: 'Shopping', note: 'Groceries', emoji: '🛒', frequency: 1 },
      { label: 'Petrol / Fuel', amount: 300, category: 'Transport', note: 'Vehicle fuel', emoji: '⛽', frequency: 1 },
    ];
  }

  return result.slice(0, 5);
}


