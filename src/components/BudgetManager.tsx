import React, { useState, useMemo } from 'react';
import { Target, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Save, SlidersHorizontal, ArrowUpRight, ArrowDownRight, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { BudgetStatusRow } from '../types/project';
import { ExpenseDatabase, DEFAULT_BUDGETS, CATEGORIES } from '../utils/expenseCore';

interface BudgetManagerProps {
  db: ExpenseDatabase;
  budgetStatus: BudgetStatusRow[];
  onBudgetsUpdated: () => void;
}

const CATEGORY_META: Record<string, { emoji: string; desc: string; color: string; border: string; bg: string }> = {
  Food: { emoji: '🍜', desc: 'Meals, groceries, cafes & delivery', color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50' },
  Transport: { emoji: '🚌', desc: 'Metro, cab, fuel & transit tickets', color: 'text-teal-700', border: 'border-teal-200', bg: 'bg-teal-50' },
  Rent: { emoji: '🏠', desc: 'Flat share, hostel fees & maintenance', color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50' },
  Shopping: { emoji: '🛍️', desc: 'Clothes, electronics & personal care', color: 'text-rose-700', border: 'border-rose-200', bg: 'bg-rose-50' },
  Bills: { emoji: '⚡', desc: 'Electricity, mobile recharge & Wi-Fi', color: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50' },
  Health: { emoji: '💊', desc: 'Medicines, consultations & fitness', color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  Entertainment: { emoji: '🎮', desc: 'Movies, gaming passes & outings', color: 'text-pink-700', border: 'border-pink-200', bg: 'bg-pink-50' },
  Books: { emoji: '📚', desc: 'Textbooks, courses & study tools', color: 'text-indigo-700', border: 'border-indigo-200', bg: 'bg-indigo-50' },
  Other: { emoji: '✨', desc: 'Miscellaneous and unexpected spends', color: 'text-slate-700', border: 'border-slate-200', bg: 'bg-slate-50' },
};

export const BudgetManager: React.FC<BudgetManagerProps> = ({ db, budgetStatus, onBudgetsUpdated }) => {
  const currentBudgets = db.getBudgets();
  const [limits, setLimits] = useState<Record<string, number>>({ ...currentBudgets });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'attention' | 'safe'>('all');
  const [activePreset, setActivePreset] = useState<string>('custom');

  // Days calculations
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);

  const handleLimitChange = (cat: string, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setLimits(prev => ({ ...prev, [cat]: num }));
    setSavedSuccess(false);
    setActivePreset('custom');
  };

  const handleStepChange = (cat: string, delta: number) => {
    const current = limits[cat] ?? (DEFAULT_BUDGETS[cat as keyof typeof DEFAULT_BUDGETS] || 1000);
    const updated = Math.max(250, current + delta);
    setLimits(prev => ({ ...prev, [cat]: updated }));
    setSavedSuccess(false);
    setActivePreset('custom');
  };

  const handleApplyPreset = (presetName: string) => {
    let newLimits: Record<string, number> = {};
    if (presetName === 'frugal') {
      // 20% leaner budget for saving
      Object.entries(DEFAULT_BUDGETS).forEach(([c, val]) => {
        newLimits[c] = c === 'Rent' ? val : Math.round((val * 0.8) / 100) * 100;
      });
      setActivePreset('frugal');
    } else if (presetName === 'balanced') {
      newLimits = { ...DEFAULT_BUDGETS };
      setActivePreset('balanced');
    } else if (presetName === 'generous') {
      // 20% higher buffer
      Object.entries(DEFAULT_BUDGETS).forEach(([c, val]) => {
        newLimits[c] = Math.round((val * 1.2) / 100) * 100;
      });
      setActivePreset('generous');
    }
    setLimits(newLimits);
    setSavedSuccess(false);
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    Object.entries(limits).forEach(([cat, lim]) => {
      if (lim > 0) {
        db.setBudget(cat, lim);
      }
    });
    setSavedSuccess(true);
    onBudgetsUpdated();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Aggregated Analytics
  const totalMonthlyBudget = Object.values(limits).reduce((a, b) => a + b, 0);
  const totalSpent = budgetStatus.reduce((acc, row) => acc + row.spent, 0);
  const totalRemaining = Math.max(0, totalMonthlyBudget - totalSpent);
  const totalUtilization = totalMonthlyBudget > 0 ? (totalSpent / totalMonthlyBudget) * 100 : 0;

  // Filtered List
  const filteredStatus = useMemo(() => {
    return budgetStatus.filter(b => {
      if (activeFilter === 'attention') return b.status === 'Warning' || b.status === 'Over';
      if (activeFilter === 'safe') return b.status === 'OK';
      return true;
    });
  }, [budgetStatus, activeFilter]);

  const overCount = budgetStatus.filter(b => b.status === 'Over').length;
  const warningCount = budgetStatus.filter(b => b.status === 'Warning').length;
  const safeCount = budgetStatus.filter(b => b.status === 'OK').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header Dashboard Banner */}
      <div className="bg-gradient-to-br from-[#1b1340] to-[#2d1b69] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#d4ff3f]/20 text-[#d4ff3f] border border-[#d4ff3f]/30 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Budget Intelligence &amp; Ceilings
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Monthly Category Budgets
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Active financial limits mapped across <strong>all {CATEGORIES.length} spending categories</strong>. Alerts automatically trigger at <strong className="text-amber-400">80% Warning</strong> and <strong className="text-rose-400">100% Over-Limit</strong>.
            </p>
          </div>

          {/* Aggregate Metric Pods */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Cap</span>
              <span className="text-lg sm:text-xl font-black font-mono text-white">
                ₹{totalMonthlyBudget.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Spent So Far</span>
              <span className="text-lg sm:text-xl font-black font-mono text-[#d4ff3f]">
                ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Remaining Buffer</span>
              <span className="text-lg sm:text-xl font-black font-mono text-cyan-300">
                ₹{totalRemaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d4ff3f]" />
              Overall Month Utilization: {totalUtilization.toFixed(1)}%
            </span>
            <span className="text-slate-400 font-mono">
              {daysRemaining} days remaining in current month
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                totalUtilization >= 100
                  ? 'bg-rose-500'
                  : totalUtilization >= 80
                  ? 'bg-amber-400'
                  : 'bg-[#d4ff3f]'
              }`}
              style={{ width: `${Math.min(100, totalUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Bar: Presets & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Preset Strategies */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            Quick Presets:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('frugal')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activePreset === 'frugal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Student Frugal (-20%)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('balanced')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activePreset === 'balanced'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Standard Balanced
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('generous')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activePreset === 'generous'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Comfortable (+20%)
          </button>
        </div>

        {/* Category Health Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories ({budgetStatus.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('attention')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              activeFilter === 'attention'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Alerts ({overCount + warningCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('safe')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              activeFilter === 'safe'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            On Track ({safeCount})
          </button>
        </div>
      </div>

      {/* Main Category Budget Grid */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStatus.map(b => {
            const meta = CATEGORY_META[b.category] || { emoji: '💰', desc: 'Category expense', color: 'text-slate-700', border: 'border-slate-200', bg: 'bg-slate-50' };
            const currentLimit = limits[b.category] ?? b.limit;
            const remaining = currentLimit - b.spent;
            const safeDailyRate = remaining > 0 ? (remaining / daysRemaining) : 0;

            // Badges
            let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            let statusText = 'On Track';
            let barColor = 'bg-emerald-500';

            if (b.status === 'Over') {
              badgeBg = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
              statusText = 'Over Budget';
              barColor = 'bg-rose-500';
            } else if (b.status === 'Warning') {
              badgeBg = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
              statusText = '80%+ Warning';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={b.category}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between gap-4"
              >
                {/* Top Category Info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.color} border ${meta.border} flex items-center justify-center text-xl shrink-0`}>
                        {meta.emoji}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                          {b.category}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{meta.desc}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeBg} whitespace-nowrap`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Financial Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Spent</span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        ₹{b.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {remaining >= 0 ? 'Remaining' : 'Over Limit'}
                      </span>
                      <span className={`font-mono font-black text-sm ${remaining >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {remaining >= 0 ? `₹${remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : `+₹${Math.abs(remaining).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">
                        {b.used_pct.toFixed(0)}% used
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Safe: ~₹{safeDailyRate.toFixed(0)}/day
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, b.used_pct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Limit Adjustment & Stepper */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-600">
                      Monthly Limit (INR)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStepChange(b.category, -500)}
                        className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                        title="Reduce budget by ₹500"
                      >
                        -500
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepChange(b.category, 500)}
                        className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                        title="Increase budget by ₹500"
                      >
                        +500
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="100"
                      min="100"
                      value={currentLimit}
                      onChange={e => handleLimitChange(b.category, e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Toast Banner */}
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-extrabold flex items-center justify-center gap-2 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>All category budgets successfully updated and locked in your local database!</span>
          </div>
        )}

        {/* Master Save Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="submit"
            className="w-full sm:flex-1 py-3.5 bg-[#1b1340] hover:bg-[#281b5d] text-white font-black rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#d4ff3f]" />
            <span>Save All Category Budgets</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('balanced')}
            className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Restore Defaults</span>
          </button>
        </div>
      </form>
    </div>
  );
};
