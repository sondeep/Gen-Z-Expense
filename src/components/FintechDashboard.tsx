import React, { useState, useMemo } from 'react';
import { Plus, TrendingUp, Wallet, Trash2, Calendar, CreditCard, ChevronRight, PiggyBank, CheckCircle2, Zap, Search, X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Expense, BudgetStatusRow, AnomalyExpense } from '../types/project';
import {
  ExpenseDatabase,
  CATEGORIES,
  Category,
  SmartQuickSpend,
  generateSmartQuickSpends,
} from '../utils/expenseCore';

interface FintechDashboardProps {
  db: ExpenseDatabase;
  expenses: Expense[];
  budgetStatus: BudgetStatusRow[];
  anomalies: AnomalyExpense[];
  forecast: {
    spentSoFar: number;
    daysElapsed: number;
    daysInMonth: number;
    forecastTotal: number;
    dailyRunRate: number;
  };
  totalBudget: number;
  onOpenAddExpense: () => void;
  onOpenAnalytics: () => void;
  onOpenBudgets?: () => void;
  onOpenSubscriptions: () => void;
  onOpenSavings: () => void;
  onDeleteExpense: (id: number) => void;
  onRefresh: () => void;
  isAutoFetchActive?: boolean;
  onRequestPermission?: () => void;
}

const CATEGORY_ICONS: Record<string, { emoji: string; bg: string; text: string }> = {
  Food: { emoji: '🍜', bg: 'bg-orange-50', text: 'text-orange-700' },
  Transport: { emoji: '🚌', bg: 'bg-teal-50', text: 'text-teal-700' },
  Rent: { emoji: '🏠', bg: 'bg-purple-50', text: 'text-purple-700' },
  Shopping: { emoji: '🛍️', bg: 'bg-amber-50', text: 'text-amber-700' },
  Bills: { emoji: '⚡', bg: 'bg-blue-50', text: 'text-blue-700' },
  Health: { emoji: '💊', bg: 'bg-rose-50', text: 'text-rose-700' },
  Entertainment: { emoji: '🎮', bg: 'bg-pink-50', text: 'text-pink-700' },
  Books: { emoji: '📚', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  Other: { emoji: '✨', bg: 'bg-slate-50', text: 'text-slate-700' },
};

export const FintechDashboard: React.FC<FintechDashboardProps> = ({
  db,
  expenses,
  budgetStatus,
  anomalies,
  forecast,
  totalBudget,
  onOpenAddExpense,
  onOpenAnalytics,
  onOpenBudgets,
  onOpenSubscriptions,
  onOpenSavings,
  onDeleteExpense,
  onRefresh,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'upi' | 'card' | 'cash'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'alerts' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string>('');
  const [undoExpenseId, setUndoExpenseId] = useState<number | null>(null);
  const [pendingPreset, setPendingPreset] = useState<SmartQuickSpend | null>(null);

  // Dynamically analyze user spending data to produce smart quick spend options
  const dynamicQuickSpends = useMemo(() => generateSmartQuickSpends(expenses), [expenses]);

  const subscriptions = useMemo(() => db.getSubscriptions(), [db, expenses]);
  const savingsGoals = useMemo(() => db.getSavingsGoals(), [db, expenses]);

  const activeSubscriptionsTotal = useMemo(() => {
    return subscriptions.filter(s => s.isActive).reduce((sum, s) => sum + s.amount, 0);
  }, [subscriptions]);

  const totalSaved = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  }, [savingsGoals]);

  // Next upcoming bills in the next 30 days
  const upcomingBills = useMemo(() => {
    const today = new Date().getDate();
    return subscriptions
      .filter(s => s.isActive)
      .map(s => {
        let daysAway = s.dayOfMonth - today;
        if (daysAway < 0) {
          daysAway += 30;
        }
        return { ...s, daysAway };
      })
      .sort((a, b) => a.daysAway - b.daysAway)
      .slice(0, 3);
  }, [subscriptions]);

  const daysInMonth = forecast.daysInMonth;
  const daysRemaining = Math.max(1, daysInMonth - forecast.daysElapsed + 1);

  const budgetUsedPct = totalBudget > 0 ? Math.min(100, Math.round((forecast.spentSoFar / totalBudget) * 100)) : 0;
  const remainingBudget = Math.max(0, totalBudget - forecast.spentSoFar);
  const safeDailySpend = Math.round(remainingBudget / daysRemaining);

  // Live filtered expenses with search & multiple criteria
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      // Payment mode filter
      if (filterMode === 'upi' && e.payment_mode !== 'UPI') return false;
      if (filterMode === 'card' && e.payment_mode !== 'Card') return false;
      if (filterMode === 'cash' && e.payment_mode !== 'Cash') return false;

      // Category filter
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;

      // Search query filter (matches note, category, or amount)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNote = (e.note || '').toLowerCase().includes(q);
        const matchCat = e.category.toLowerCase().includes(q);
        const matchAmt = e.amount.toString().includes(q);
        const matchDate = e.date.includes(q);
        if (!matchNote && !matchCat && !matchAmt && !matchDate) return false;
      }

      return true;
    });
  }, [expenses, filterMode, categoryFilter, searchQuery]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleSelectPreset = (preset: SmartQuickSpend) => {
    // Prevent accidental clicks / blunders: require confirmation!
    setPendingPreset(preset);
  };

  const handleConfirmMicroLog = () => {
    if (!pendingPreset) return;
    const today = new Date().toISOString().slice(0, 10);
    const added = db.addExpense(today, pendingPreset.amount, pendingPreset.category, pendingPreset.note, 'UPI');
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate?.(40);
    }
    setUndoExpenseId(added.id);
    setToastMsg(`✓ Recorded ₹${pendingPreset.amount} for ${pendingPreset.label}!`);
    const savedLabel = pendingPreset.label;
    setPendingPreset(null);
    onRefresh();
    setTimeout(() => {
      setToastMsg(prev => (prev.includes(savedLabel) ? '' : prev));
      setUndoExpenseId(null);
    }, 6000);
  };

  const handleUndoLastExpense = () => {
    if (undoExpenseId !== null) {
      db.deleteExpense(undoExpenseId);
      setUndoExpenseId(null);
      setToastMsg('↩ Expense undone and removed.');
      onRefresh();
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleMarkBillPaid = (bill: typeof upcomingBills[0]) => {
    const today = new Date().toISOString().slice(0, 10);
    db.addExpense(today, bill.amount, bill.category as Category, `${bill.name} (Recurring Bill)`, 'UPI');
    setToastMsg(`✓ Recorded ₹${bill.amount.toLocaleString('en-IN')} payment for ${bill.name}!`);
    onRefresh();
    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <div className="space-y-3.5 sm:space-y-6 pb-24 sm:pb-8">
      {/* Toast Alert with Undo Button */}
      {toastMsg && (
        <div className="p-3 bg-slate-900 border border-slate-800 text-white text-xs rounded-2xl flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          {undoExpenseId !== null && (
            <button
              onClick={handleUndoLastExpense}
              className="px-2.5 py-1 bg-[#d4ff3f] text-slate-900 hover:bg-[#c2ef2c] rounded-lg font-black text-[11px] transition-all shadow-xs active:scale-95 shrink-0"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* Hero Financial Runway & Safe Spend Card */}
      <div className="bg-[#1b1340] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile View: High-efficiency compact card without vertical clutter */}
        <div className="sm:hidden space-y-3 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                Daily Spending Runway
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black font-mono text-[#d4ff3f]">
                  ₹{safeDailySpend.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-300 font-semibold">/ day</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Safe for next <strong className="text-white">{daysRemaining} days</strong>
              </p>
            </div>

            {/* Compact circular progress */}
            <div className="relative w-18 h-18 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="6" />
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  fill="none"
                  stroke="#d4ff3f"
                  strokeWidth="6"
                  strokeDasharray="176"
                  strokeDashoffset={176 - (176 * budgetUsedPct) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-black font-mono text-white leading-none">{budgetUsedPct}%</span>
                <span className="text-[8px] font-bold text-[#d4ff3f] uppercase mt-0.5">Used</span>
              </div>
            </div>
          </div>

          {/* Budget progress bar */}
          <div className="pt-2 border-t border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300">₹{forecast.spentSoFar.toLocaleString('en-IN', { maximumFractionDigits: 0 })} spent</span>
              <span className="text-slate-400 font-mono">Budget: ₹{totalBudget.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4ff3f] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
              />
            </div>
          </div>

          {/* Compact forecast metrics */}
          <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs">
            <div className="bg-white/5 rounded-xl p-2 border border-white/10">
              <span className="text-slate-400 block text-[10px]">Month Forecast</span>
              <strong className="text-white text-xs font-mono block mt-0.5">
                ₹{forecast.forecastTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </strong>
              <span className={`text-[9px] font-bold mt-0.5 block ${forecast.forecastTotal > totalBudget ? 'text-amber-300' : 'text-emerald-300'}`}>
                {forecast.forecastTotal > totalBudget ? '⚠️ Overrun' : '✓ On Target'}
              </span>
            </div>

            <div className="bg-white/5 rounded-xl p-2 border border-white/10">
              <span className="text-slate-400 block text-[10px]">Daily Pace</span>
              <strong className="text-white text-xs font-mono block mt-0.5">
                ₹{forecast.dailyRunRate.toFixed(0)} / day
              </strong>
              <span className="text-[9px] text-slate-400 mt-0.5 block truncate">
                Current pace
              </span>
            </div>
          </div>
        </div>

        {/* Desktop View (Full Rich Gauge & Details) */}
        <div className="hidden sm:grid sm:grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          {/* Circular Gauge */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="16"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke="#d4ff3f"
                  strokeWidth="16"
                  strokeDasharray="402"
                  strokeDashoffset={402 - (402 * budgetUsedPct) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black font-mono tracking-tight text-white">
                  {budgetUsedPct}%
                </span>
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Used
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-300 font-mono">
              ₹{forecast.spentSoFar.toLocaleString('en-IN', { maximumFractionDigits: 0 })} spent of ₹{totalBudget.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Safe Spend Daily Runway */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Daily Spending Runway
              </span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#d4ff3f] font-mono mt-1">
                ₹{safeDailySpend.toLocaleString('en-IN')}
                <span className="text-sm font-normal text-slate-300"> / day</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Safe amount to spend daily for the next <strong className="text-white font-bold">{daysRemaining} days</strong> to stay strictly within your monthly budget.
              </p>
            </div>

            {/* Micro Metrics Strip */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-slate-400 block text-[11px]">Month-End Forecast</span>
                <strong className="text-white text-sm font-mono block mt-0.5">
                  ₹{forecast.forecastTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </strong>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {forecast.forecastTotal > totalBudget ? '⚠️ Projected Overrun' : '✓ Within Budget Limit'}
                </span>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-slate-400 block text-[11px]">Daily Spending Pace</span>
                <strong className="text-white text-sm font-mono block mt-0.5">
                  ₹{forecast.dailyRunRate.toFixed(0)}
                  <span className="text-xs text-slate-400 font-normal"> / day</span>
                </strong>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Based on your spending this month
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={onOpenAddExpense}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6c4cf1] hover:bg-[#5b3ce0] text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 text-[#d4ff3f]" />
                <span>Add Expense Manually</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Spends Strip Dynamically Generated from User Spending Habits */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quick Spends
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Habit Spends
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
          {dynamicQuickSpends.map(p => (
            <button
              key={p.label}
              onClick={() => handleSelectPreset(p)}
              className="shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl sm:rounded-2xl text-xs font-bold text-slate-800 flex items-center gap-2 transition-all active:scale-95 group shadow-2xs"
            >
              <span className="text-sm sm:text-base group-hover:scale-110 transition-transform">{p.emoji}</span>
              <span className="whitespace-nowrap">{p.label}</span>
              <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-black text-[11px] sm:text-xs">
                ₹{p.amount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Bills & Subscriptions Reminder */}
      {upcomingBills.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Upcoming Bills &amp; Dues</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Due within next 30 days</p>
              </div>
            </div>

            <button
              onClick={onOpenSubscriptions}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {upcomingBills.map(b => (
              <div
                key={b.id}
                className="p-2.5 sm:p-3.5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base sm:text-xl shrink-0">
                    {CATEGORY_ICONS[b.category]?.emoji || '📅'}
                  </span>
                  <div className="min-w-0">
                    <strong className="block text-slate-900 font-bold truncate text-xs">{b.name}</strong>
                    <span className="text-[10px] sm:text-[11px] text-amber-700 font-medium">
                      Due in {b.daysAway === 0 ? 'Today' : `${b.daysAway} days`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    ₹{b.amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleMarkBillPaid(b)}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors"
                  >
                    Mark Paid
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 text-[11px] sm:text-xs">Monthly Subscriptions Total:</span>
            <strong className="font-mono text-slate-900 font-bold text-xs sm:text-sm">
              ₹{activeSubscriptionsTotal.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      )}

      {/* Row 3: Category Spending Progress & Searchable Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Allocations */}
        {/* Category Allocations - Complete All 9 Categories with Interactive Health Filters */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Category Budgets</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {budgetStatus.length} Categories
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Live spending vs monthly caps</p>
            </div>

            <div className="flex items-center gap-2">
              {onOpenBudgets ? (
                <button
                  onClick={onOpenBudgets}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition cursor-pointer"
                >
                  Adjust Limits
                </button>
              ) : (
                <button
                  onClick={onOpenAnalytics}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  View Trends
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl text-xs font-bold">
            <button
              onClick={() => setBudgetFilter('all')}
              className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                budgetFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({budgetStatus.length})
            </button>
            <button
              onClick={() => setBudgetFilter('alerts')}
              className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                budgetFilter === 'alerts'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              Alerts ({budgetStatus.filter(b => b.status === 'Over' || b.status === 'Warning').length})
            </button>
            <button
              onClick={() => setBudgetFilter('safe')}
              className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                budgetFilter === 'safe'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              On Track ({budgetStatus.filter(b => b.status === 'OK').length})
            </button>
          </div>

          {/* Category List - Complete & Polished */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
            {budgetStatus
              .filter(b => {
                if (budgetFilter === 'alerts') return b.status === 'Over' || b.status === 'Warning';
                if (budgetFilter === 'safe') return b.status === 'OK';
                return true;
              })
              .map(b => {
                const meta = CATEGORY_ICONS[b.category] || { emoji: '💰', bg: 'bg-slate-50', text: 'text-slate-700' };
                const remaining = b.limit - b.spent;

                let barColor = 'bg-gradient-to-r from-emerald-500 to-teal-500';
                let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                let statusLabel = 'On Track';

                if (b.status === 'Over') {
                  barColor = 'bg-gradient-to-r from-rose-500 to-red-600';
                  badgeColor = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
                  statusLabel = 'Over Budget';
                } else if (b.status === 'Warning') {
                  barColor = 'bg-gradient-to-r from-amber-400 to-amber-500';
                  badgeColor = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                  statusLabel = 'Warning 80%+';
                }

                return (
                  <div
                    key={b.category}
                    className="p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center text-sm shrink-0 shadow-2xs`}>
                          {meta.emoji}
                        </span>
                        <span className="font-extrabold text-slate-900 truncate">{b.category}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border ${badgeColor} shrink-0`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          ₹{b.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] ml-1">
                          / ₹{b.limit.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, b.used_pct)}%` }}
                      />
                    </div>

                    {/* Footer Info: Percentage + Remaining Balance */}
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-slate-500 font-medium">
                        {b.used_pct.toFixed(0)}% used
                      </span>
                      <span className={`font-mono font-bold ${remaining >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {remaining >= 0
                          ? `₹${remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })} left`
                          : `+₹${Math.abs(remaining).toLocaleString('en-IN', { maximumFractionDigits: 0 })} over`}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Searchable Recent Transactions Feed */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500">
                Showing {filteredExpenses.length} of {expenses.length} records ·{' '}
                <span className="font-mono font-bold text-slate-900">
                  Total ₹{filteredTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </p>
            </div>

            {/* Mode Filters */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs shrink-0">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('upi')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === 'upi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                UPI
              </button>
              <button
                onClick={() => setFilterMode('card')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setFilterMode('cash')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === 'cash' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          {/* Search Bar & Category Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search merchant, Swiggy, Uber, coffee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="sm:col-span-4">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {CATEGORY_ICONS[c]?.emoji || '•'} {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.slice(0, 20).map(e => {
                const meta = CATEGORY_ICONS[e.category] || { emoji: '💰', bg: 'bg-slate-50', text: 'text-slate-700' };
                return (
                  <div
                    key={e.id}
                    className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-between gap-2.5 text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl sm:text-2xl p-1 sm:p-1.5 bg-white rounded-xl border border-slate-200 shrink-0">
                        {meta.emoji}
                      </span>
                      <div className="min-w-0">
                        <strong className="block text-slate-900 font-bold text-xs sm:text-sm truncate">
                          {e.note || e.category}
                        </strong>
                        <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium block truncate">
                          {e.date} · {e.category} ·{' '}
                          <span className="text-indigo-700 font-semibold">{e.payment_mode}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="text-xs sm:text-sm font-black font-mono text-slate-950">
                        ₹{e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => onDeleteExpense(e.id)}
                        title="Delete expense"
                        className="opacity-70 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                No transactions match your search or filter criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal: Prevents Accidental Clicks / Blunders */}
      {pendingPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                  {pendingPreset.emoji}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Confirm Expense</h3>
                  <p className="text-[11px] text-slate-500">Preview to prevent accidental logs</p>
                </div>
              </div>
              <button
                onClick={() => setPendingPreset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">
                Amount to Record
              </span>
              <div className="text-3xl font-black font-mono text-slate-900">
                ₹{pendingPreset.amount}
              </div>
              <p className="text-xs font-bold text-slate-700">
                {pendingPreset.label} · <span className="text-indigo-600 font-semibold">{pendingPreset.category}</span>
              </p>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Record this expense for today? You can undo anytime.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setPendingPreset(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMicroLog}
                className="py-2.5 px-4 bg-[#6c4cf1] hover:bg-[#5b3ce0] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check className="w-3.5 h-3.5 text-[#d4ff3f]" />
                <span>Confirm &amp; Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
