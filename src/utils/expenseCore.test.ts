import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ExpenseDatabase,
  getCategorySummary,
  getMonthlyTrend,
  getBudgetStatus,
  detectAnomalies,
  calculateMonthEndForecast,
  calculateFinancialHealth,
  parseBatchBankSms,
  generateSmartQuickSpends,
} from './expenseCore';

test('Role 1: ExpenseDatabase validation rejects negative amounts', () => {
  const db = new ExpenseDatabase(false);
  assert.throws(() => {
    db.addExpense('2026-11-01', -50, 'Food');
  }, /Amount must be positive/);
});

test('Role 1: ExpenseDatabase validation rejects zero amount', () => {
  const db = new ExpenseDatabase(false);
  assert.throws(() => {
    db.addExpense('2026-11-01', 0, 'Food');
  }, /Amount must be positive/);
});

test('Role 1: ExpenseDatabase validation rejects unknown categories', () => {
  const db = new ExpenseDatabase(false);
  assert.throws(() => {
    db.addExpense('2026-11-01', 250, 'Gold');
  }, /Unknown category: Gold/);
});

test('Role 1: ExpenseDatabase validation accepts valid expenses and assigns sequential IDs', () => {
  const db = new ExpenseDatabase(false);
  const e1 = db.addExpense('2026-11-01', 250, 'Food', 'Lunch');
  const e2 = db.addExpense('2026-11-02', 150, 'Transport', 'Metro', 'UPI');
  assert.equal(e1.id, 1);
  assert.equal(e2.id, 2);
  assert.equal(db.getExpenses().length, 2);
});

test('Role 2: Category Summary aggregates correctly across transactions', () => {
  const db = new ExpenseDatabase(false);
  db.addExpense('2026-11-01', 100, 'Food');
  db.addExpense('2026-11-02', 50, 'Food');
  db.addExpense('2026-11-03', 200, 'Transport');

  const summary = getCategorySummary(db.getExpenses());
  assert.equal(summary['Food'], 150);
  assert.equal(summary['Transport'], 200);
});

test('Role 2: Budget status classifies OK, Warning, and Over correctly', () => {
  const db = new ExpenseDatabase(false);
  // Food: 4000 / 6000 = 66.7% -> OK
  db.addExpense('2026-11-01', 4000, 'Food');
  // Transport: 2100 / 2500 = 84% -> Warning (>= 80%)
  db.addExpense('2026-11-02', 2100, 'Transport');
  // Shopping: 3500 / 3000 = 116.7% -> Over (> 100%)
  db.addExpense('2026-11-03', 3500, 'Shopping');

  const budgets = { Food: 6000, Transport: 2500, Shopping: 3000 };
  const status = getBudgetStatus(db.getExpenses(), budgets, '2026-11');

  const foodStatus = status.find(s => s.category === 'Food');
  const transportStatus = status.find(s => s.category === 'Transport');
  const shoppingStatus = status.find(s => s.category === 'Shopping');

  assert.equal(foodStatus?.status, 'OK');
  assert.equal(transportStatus?.status, 'Warning');
  assert.equal(shoppingStatus?.status, 'Over');
});

test('Role 2: Z-Score Anomaly detection identifies extreme values above 2.0 std dev', () => {
  const db = new ExpenseDatabase(false);
  // Add 10 normal food purchases around ~100-150
  for (let i = 1; i <= 10; i++) {
    db.addExpense(`2026-11-0${Math.min(9, i)}`, 100 + i * 5, 'Food');
  }
  // Add 1 extreme anomaly
  db.addExpense('2026-11-10', 4500, 'Food', 'Fine Dining Party');

  const anomalies = detectAnomalies(db.getExpenses(), 2.0);
  assert.equal(anomalies.length, 1);
  assert.equal(anomalies[0].amount, 4500);
  assert.ok(anomalies[0].zScore > 2.0);
});

test('Role 2: Run-Rate Forecast matches projection formula', () => {
  const db = new ExpenseDatabase(false);
  // Day 5: 500 spent
  db.addExpense('2026-11-05', 500, 'Food');
  const refDate = new Date(2026, 10, 5); // Nov 5, 2026 (Nov has 30 days)

  const forecast = calculateMonthEndForecast(db.getExpenses(), refDate);
  // spent: 500 / 5 days elapsed * 30 days in month = 3000
  assert.equal(forecast.spentSoFar, 500);
  assert.equal(forecast.daysElapsed, 5);
  assert.equal(forecast.daysInMonth, 30);
  assert.equal(forecast.forecastTotal, 3000);
});

test('Role 1 & 4: CSV Export & Import roundtrip preserves valid records', () => {
  const db = new ExpenseDatabase(false);
  db.addExpense('2026-11-01', 250, 'Food', 'Sandwich and coffee', 'Card');
  db.addExpense('2026-11-02', 450, 'Books', 'Data Structures Notes', 'UPI');

  const csv = db.exportCSV();
  const db2 = new ExpenseDatabase(false);
  const result = db2.importCSV(csv);

  assert.equal(result.imported, 2);
  assert.equal(result.errors.length, 0);
  assert.equal(db2.getExpenses().length, 2);
});

test('Industry Feature: Financial Health score calculates accurately', () => {
  const db = new ExpenseDatabase(false);
  db.addExpense('2026-11-01', 1000, 'Food');
  const budgets = { Food: 6000, Rent: 9000 };
  const forecast = {
    spentSoFar: 1000,
    daysElapsed: 5,
    daysInMonth: 30,
    forecastTotal: 6000,
    dailyRunRate: 200,
  };
  const health = calculateFinancialHealth(db.getExpenses(), budgets, forecast, []);
  assert.ok(health.score >= 70);
  assert.ok(health.tips.length > 0);
});

test('Industry Feature: Batch SMS parser extracts multiple bank texts', () => {
  const batch = `
Sent Rs. 350.00 from Kotak Bank AC X1234 to swiggy@icici on 08-11-2026 Ref 431289123891.

HDFC Bank: Rs 2,850.00 debited from a/c **4321 on 07-11-26 to RELIANCE RETAIL. Avl bal: Rs 45,210.
`;
  const { success, failedCount } = parseBatchBankSms(batch);
  assert.equal(success.length, 2);
  assert.equal(failedCount, 0);
  assert.equal(success[0].amount, 350);
  assert.equal(success[1].amount, 2850);
});

test('Industry Feature: generateSmartQuickSpends dynamically clusters user habit data', () => {
  const db = new ExpenseDatabase(false);
  // Add 4 Chai expenses with slightly varying amounts (20, 20, 25, 20)
  db.addExpense('2026-11-01', 20, 'Food', 'Chai break');
  db.addExpense('2026-11-02', 20, 'Food', 'Chai & samosa');
  db.addExpense('2026-11-03', 25, 'Food', 'Evening chai');
  db.addExpense('2026-11-04', 20, 'Food', 'Chai stall');

  // Add 2 Metro expenses (50, 50)
  db.addExpense('2026-11-01', 50, 'Transport', 'Metro card recharge');
  db.addExpense('2026-11-03', 50, 'Transport', 'Metro fare');

  // Add 1 Petrol expense
  db.addExpense('2026-11-05', 300, 'Transport', 'Petrol Shell');

  const habits = generateSmartQuickSpends(db.getExpenses());
  assert.ok(habits.length > 0);

  // Highest frequency should be Chai / Coffee (4x)
  assert.equal(habits[0].label, 'Chai / Coffee');
  assert.equal(habits[0].frequency, 4);
  assert.equal(habits[0].amount, 20); // typical median

  // Second highest should be Metro / Cab Ride (2x)
  assert.equal(habits[1].label, 'Metro / Cab Ride');
  assert.equal(habits[1].frequency, 2);
  assert.equal(habits[1].amount, 50);
});


