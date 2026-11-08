import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calculator,
  Sparkles,
  Zap,
  CreditCard,
  CheckCircle2,
  Activity,
  Award,
  PieChart
} from 'lucide-react';
import { Expense, BudgetStatusRow } from '../types/project';
import { getCategorySummary, getMonthlyTrend, getTopSpends } from '../utils/expenseCore';

interface AnalyticsViewProps {
  expenses: Expense[];
  budgetStatus: BudgetStatusRow[];
  forecast: {
    spentSoFar: number;
    daysElapsed: number;
    daysInMonth: number;
    forecastTotal: number;
    dailyRunRate: number;
  };
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍜',
  Transport: '🚌',
  Rent: '🏠',
  Shopping: '🛍️',
  Bills: '⚡',
  Health: '💊',
  Entertainment: '🎮',
  Books: '📚',
  Other: '✨',
};

const MODE_COLORS: Record<string, { bg: string; bar: string; text: string; ring: string }> = {
  UPI: { bg: 'bg-indigo-50', bar: 'bg-[#6c4cf1]', text: 'text-[#6c4cf1]', ring: 'border-indigo-200' },
  Card: { bg: 'bg-emerald-50', bar: 'bg-emerald-500', text: 'text-emerald-700', ring: 'border-emerald-200' },
  Cash: { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-700', ring: 'border-amber-200' },
  'Net Banking': { bg: 'bg-blue-50', bar: 'bg-blue-600', text: 'text-blue-700', ring: 'border-blue-200' },
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ expenses, budgetStatus, forecast }) => {
  const catSummary = useMemo(() => getCategorySummary(expenses), [expenses]);
  const totalSpend = useMemo(() => Object.values(catSummary).reduce((a, b) => a + b, 0), [catSummary]);
  const monthlyTrends = useMemo(() => getMonthlyTrend(expenses), [expenses]);
  const topExpenses = useMemo(() => getTopSpends(expenses, 5), [expenses]);

  // Total allocated budget across all categories
  const totalBudget = useMemo(() => {
    return budgetStatus.reduce((sum, b) => sum + b.limit, 0);
  }, [budgetStatus]);

  const isOverrunProjected = forecast.forecastTotal > totalBudget && totalBudget > 0;
  const daysRemaining = Math.max(1, forecast.daysInMonth - forecast.daysElapsed);
  const budgetUsedPct = totalBudget > 0 ? Math.min(100, Math.round((forecast.spentSoFar / totalBudget) * 100)) : 0;
  const remainingBudget = Math.max(0, totalBudget - forecast.spentSoFar);

  // Compute payment mode breakdown
  const paymentModeSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    expenses.forEach(e => {
      summary[e.payment_mode] = (summary[e.payment_mode] || 0) + e.amount;
    });
    return summary;
  }, [expenses]);

  // Max value in monthly trends for proportional bar scaling
  const maxMonthlySpend = useMemo(() => {
    const vals = Object.values(monthlyTrends);
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }, [monthlyTrends]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-12 animate-in fade-in duration-300">
      {/* 1. Executive Intelligence Hero Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1b1340] via-[#23154f] to-[#120a2e] text-white p-4 sm:p-7 shadow-xl border border-white/10">
        {/* Ambient background glows */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/4 w-72 h-72 bg-[#d4ff3f]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
          {/* Header Title with Live Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-[#d4ff3f] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#d4ff3f]" />
                  Spending Intelligence
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {expenses.length} Records Analyzed
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Spending Insights &amp; Analytics
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time velocity tracking, monthly projections, and payment channel distribution
              </p>
            </div>

            {/* Total Spend Badge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between sm:justify-start gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#d4ff3f] text-slate-950 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">
                  Total Ledger Spend
                </span>
                <span className="text-lg sm:text-xl font-black text-white font-mono leading-tight">
                  ₹{totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Key KPI Triad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 pt-3 border-t border-white/10">
            {/* Metric 1: Daily Velocity */}
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#d4ff3f]" />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
                  Daily Spend Pace
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base sm:text-lg font-black font-mono text-white">
                    ₹{forecast.dailyRunRate.toFixed(0)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">/ day</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Over past {forecast.daysElapsed} days
                </span>
              </div>
            </div>

            {/* Metric 2: Month Projection */}
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
                  Month-End Projected
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base sm:text-lg font-black font-mono text-white">
                    ₹{forecast.forecastTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <span className={`text-[10px] font-bold mt-0.5 block ${isOverrunProjected ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {isOverrunProjected ? '⚠️ Projected Overrun' : '✓ Safe within Budget'}
                </span>
              </div>
            </div>

            {/* Metric 3: Budget Utilization */}
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d4ff3f]/15 text-[#d4ff3f] flex items-center justify-center shrink-0">
                <PieChart className="w-5 h-5 text-[#d4ff3f]" />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
                  Budget Capacity
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base sm:text-lg font-black font-mono text-white">
                    {budgetUsedPct}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">utilized</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ₹{remainingBudget.toLocaleString('en-IN')} remaining
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid: Month-End Run-Rate Forecast & Payment Modes Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Run-Rate Forecast Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-[#6c4cf1]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Month-End Velocity Forecast
                </h3>
                <p className="text-[11px] text-slate-500">Linear progression based on {forecast.daysElapsed} days elapsed</p>
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl shrink-0 whitespace-nowrap">
              {daysRemaining} days left
            </span>
          </div>

          {/* Forecast 3-Box Pill Layout */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block">
                Spent So Far
              </span>
              <strong className="text-sm sm:text-lg font-black text-slate-900 font-mono my-1 block">
                ₹{forecast.spentSoFar.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </strong>
              <span className="text-[10px] text-slate-400 block">{forecast.daysElapsed} days logged</span>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] text-indigo-900 font-semibold block">
                Current Pace
              </span>
              <strong className="text-sm sm:text-lg font-black text-[#6c4cf1] font-mono my-1 block">
                ₹{forecast.dailyRunRate.toFixed(0)}
              </strong>
              <span className="text-[10px] text-indigo-600 block">per day rate</span>
            </div>

            <div className={`p-3 rounded-2xl border flex flex-col justify-between ${isOverrunProjected ? 'bg-amber-50/80 border-amber-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
              <span className={`text-[10px] sm:text-[11px] font-bold block ${isOverrunProjected ? 'text-amber-900' : 'text-emerald-900'}`}>
                Projected Total
              </span>
              <strong className="text-sm sm:text-lg font-black text-slate-950 font-mono my-1 block">
                ₹{forecast.forecastTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </strong>
              <span className={`text-[10px] font-bold block ${isOverrunProjected ? 'text-amber-700' : 'text-emerald-700'}`}>
                {isOverrunProjected ? 'Over budget limit' : 'Within budget target'}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Monthly Timeline Progress</span>
              <span className="font-mono font-bold text-slate-900">
                {Math.round((forecast.daysElapsed / forecast.daysInMonth) * 100)}% of month completed
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-[#6c4cf1] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((forecast.daysElapsed / forecast.daysInMonth) * 100))}%` }}
              />
            </div>
          </div>

          {/* Human-friendly Insight Callout */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              At your current daily burn velocity of <strong className="text-slate-900 font-mono">₹{forecast.dailyRunRate.toFixed(0)}/day</strong>, you will spend approximately <strong className="text-slate-900 font-mono">₹{forecast.forecastTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> by end of month.
              {isOverrunProjected && (
                <span className="text-amber-800 font-medium block mt-1">
                  💡 Tip: Slowing daily spend by ₹{Math.max(1, Math.round((forecast.forecastTotal - totalBudget) / daysRemaining))} will bring you back within your target budget!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Payment Modes Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[#6c4cf1]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Payment Modes</h3>
                <p className="text-[11px] text-slate-500">Distribution across payment channels</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono font-bold">
              {Object.keys(paymentModeSummary).length} Methods
            </span>
          </div>

          {/* Visual Channel Breakdown */}
          <div className="space-y-3 pt-1">
            {Object.entries(paymentModeSummary)
              .sort((a, b) => b[1] - a[1])
              .map(([mode, amount]) => {
                const pct = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
                const meta = MODE_COLORS[mode] || { bg: 'bg-slate-50', bar: 'bg-slate-700', text: 'text-slate-800', ring: 'border-slate-200' };

                return (
                  <div key={mode} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.bar}`} />
                        <strong className="text-slate-900 font-bold">{mode}</strong>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900">
                          ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${meta.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* 3. Monthly History & Top 5 Spends Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Monthly History */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Monthly Spending History
                </h3>
                <p className="text-[11px] text-slate-500">Historical trend across recent months</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(monthlyTrends).map(([month, val], idx) => {
              const pct = (val / maxMonthlySpend) * 100;
              const isLatest = idx === 0;

              return (
                <div key={month} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{month}</span>
                      {isLatest && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Current Month
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-slate-950 text-sm">
                      ₹{val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLatest
                          ? 'bg-gradient-to-r from-indigo-500 to-[#6c4cf1]'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Spends Leaderboard */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Top 5 Outlays
                </h3>
                <p className="text-[11px] text-slate-500">Highest individual expenses recorded</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {topExpenses.map((t, idx) => {
              const emoji = CATEGORY_EMOJIS[t.category] || '💳';
              const rankColor =
                idx === 0
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : idx === 1
                  ? 'bg-slate-200 text-slate-800 border-slate-300'
                  : idx === 2
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200';

              return (
                <div
                  key={t.id}
                  className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-black border shrink-0 ${rankColor}`}>
                      #{idx + 1}
                    </span>
                    <span className="text-base shrink-0">{emoji}</span>
                    <div className="min-w-0">
                      <strong className="block text-slate-900 font-bold truncate text-xs">
                        {t.note || t.category}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {t.date} · {t.category}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-black text-slate-950 text-xs sm:text-sm shrink-0">
                    ₹{t.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
