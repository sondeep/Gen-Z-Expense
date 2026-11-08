import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, RefreshCw, CreditCard, ChevronRight } from 'lucide-react';
import { ExpenseDatabase, detectSubscriptionsFromHistory, CATEGORIES, Category, PAYMENT_MODES, PaymentMode } from '../utils/expenseCore';
import { Subscription } from '../types/project';

interface SubscriptionsManagerProps {
  db: ExpenseDatabase;
  onUpdated: () => void;
}

export const SubscriptionsManager: React.FC<SubscriptionsManagerProps> = ({ db, onUpdated }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Entertainment');
  const [dayOfMonth, setDayOfMonth] = useState<number>(10);
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [detectedToast, setDetectedToast] = useState<string>('');

  const subscriptions = useMemo(() => db.getSubscriptions(), [db, onUpdated]);
  const expenses = useMemo(() => db.getExpenses(), [db, onUpdated]);

  const totalMonthlyCommitment = useMemo(() => {
    return subscriptions
      .filter(s => s.isActive)
      .reduce((sum, s) => sum + s.amount, 0);
  }, [subscriptions]);

  const detectedCandidates = useMemo(() => {
    return detectSubscriptionsFromHistory(expenses);
  }, [expenses]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || !name.trim()) return;

    db.addSubscription({
      name: name.trim(),
      amount: amt,
      category,
      frequency: 'monthly',
      dayOfMonth: Math.max(1, Math.min(31, dayOfMonth)),
      payment_mode: mode,
      isActive: true,
    });

    setName('');
    setAmount('');
    setShowAddForm(false);
    onUpdated();
  };

  const handlePostExpenseNow = (sub: Subscription) => {
    const today = new Date().toISOString().slice(0, 10);
    db.addExpense(today, sub.amount, sub.category, `${sub.name} (Recurring Bill)`, sub.payment_mode);
    setDetectedToast(`Logged ₹${sub.amount} for "${sub.name}" in today's expenses!`);
    setTimeout(() => setDetectedToast(''), 3500);
    onUpdated();
  };

  const handleAdoptDetected = (candidate: { name: string; category: string; amount: number; averageDayOfMonth: number }) => {
    db.addSubscription({
      name: candidate.name,
      amount: candidate.amount,
      category: candidate.category,
      frequency: 'monthly',
      dayOfMonth: candidate.averageDayOfMonth || 1,
      payment_mode: 'UPI',
      isActive: true,
    });
    setDetectedToast(`Added "${candidate.name}" to your active recurring bills!`);
    setTimeout(() => setDetectedToast(''), 3500);
    onUpdated();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
      {detectedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{detectedToast}</span>
        </div>
      )}

      {/* Hero Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
              Committed Recurring Outflow
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-[#d4ff3f] mt-1">
              ₹{totalMonthlyCommitment.toLocaleString('en-IN')}
              <span className="text-sm font-normal text-slate-300"> / month</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-lg">
              {subscriptions.filter(s => s.isActive).length} active subscriptions and fixed utilities (broadband, rent, streaming, fitness).
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6c4cf1] hover:bg-[#5b3ce0] text-white font-bold text-xs shadow-md transition-all self-start md:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#d4ff3f]" />
            <span>Add Recurring Bill</span>
          </button>
        </div>
      </div>

      {/* Auto-detected Recurring Subscriptions from History */}
      {detectedCandidates.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Pattern Detection: Recurring Expenses Found in Your History</span>
          </div>
          <p className="text-xs text-slate-700">
            We noticed these consistent repeated expenses across your transactions. Add them as tracked subscriptions with 1 click:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {detectedCandidates.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-2xl border border-amber-100 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <strong className="block text-slate-900 text-xs font-bold">{item.name}</strong>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ₹{item.amount.toLocaleString('en-IN')} · {item.occurrences}x detected
                  </span>
                </div>
                <button
                  onClick={() => handleAdoptDetected(item)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg"
                >
                  Track Bill
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Subscription Form Modal/Inline */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Add Subscription or Recurring Bill</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service / Bill Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Disney+ Hotstar"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="499"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={e => setDayOfMonth(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 bg-[#6c4cf1] hover:bg-[#5b3ce0] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Save Subscription
            </button>
          </form>
        </div>
      )}

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map(sub => (
          <div
            key={sub.id}
            className={`bg-white border rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between ${
              sub.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Due on {sub.dayOfMonth}th
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  sub.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {sub.isActive ? 'Active' : 'Paused'}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 mt-2">{sub.name}</h4>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                ₹{sub.amount.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-500"> / mo</span>
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span className="px-2 py-0.5 bg-slate-100 rounded-lg font-medium">{sub.category}</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-lg font-medium">{sub.payment_mode}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 gap-2">
              <button
                onClick={() => handlePostExpenseNow(sub)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                Post to Expenses
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    db.toggleSubscription(sub.id);
                    onUpdated();
                  }}
                  className="p-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                  title={sub.isActive ? 'Pause subscription' : 'Activate subscription'}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    db.deleteSubscription(sub.id);
                    onUpdated();
                  }}
                  className="p-1.5 text-xs text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Delete subscription"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
