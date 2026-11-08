import React, { useState } from 'react';
import { Plus, Check, ArrowLeft, Calendar, Tag, CreditCard, FileText, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { CATEGORIES, PAYMENT_MODES, ExpenseDatabase, PaymentMode, Category } from '../utils/expenseCore';
import { VoiceExpenseInput } from './VoiceExpenseInput';

interface AddExpenseFormProps {
  db: ExpenseDatabase;
  onExpenseAdded: () => void;
  onCancel?: () => void;
}

const CATEGORY_CHIPS: { name: Category; emoji: string; color: string }[] = [
  { name: 'Food', emoji: '🍜', color: 'border-orange-200 text-orange-950 bg-orange-50' },
  { name: 'Transport', emoji: '🚌', color: 'border-teal-200 text-teal-950 bg-teal-50' },
  { name: 'Shopping', emoji: '🛍️', color: 'border-amber-200 text-amber-950 bg-amber-50' },
  { name: 'Bills', emoji: '⚡', color: 'border-blue-200 text-blue-950 bg-blue-50' },
  { name: 'Health', emoji: '💊', color: 'border-rose-200 text-rose-950 bg-rose-50' },
  { name: 'Entertainment', emoji: '🎮', color: 'border-pink-200 text-pink-950 bg-pink-50' },
  { name: 'Books', emoji: '📚', color: 'border-indigo-200 text-indigo-950 bg-indigo-50' },
  { name: 'Rent', emoji: '🏠', color: 'border-purple-200 text-purple-950 bg-purple-50' },
  { name: 'Other', emoji: '✨', color: 'border-slate-200 text-slate-950 bg-slate-50' },
];

const QUICK_PRESETS = [
  { label: 'Chai / Coffee', amount: 20, category: 'Food' as Category, note: 'Tea / Coffee break', mode: 'UPI' as PaymentMode, emoji: '☕' },
  { label: 'Metro / Auto', amount: 50, category: 'Transport' as Category, note: 'Metro / Auto commute', mode: 'UPI' as PaymentMode, emoji: '🚇' },
  { label: 'Quick Meal', amount: 150, category: 'Food' as Category, note: 'Lunch / Snacks', mode: 'UPI' as PaymentMode, emoji: '🍜' },
  { label: 'Groceries', amount: 450, category: 'Shopping' as Category, note: 'Daily essentials / Veggies', mode: 'UPI' as PaymentMode, emoji: '🛒' },
  { label: 'Fuel / Petrol', amount: 300, category: 'Transport' as Category, note: 'Petrol pump fill', mode: 'UPI' as PaymentMode, emoji: '⛽' },
];

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ db, onExpenseAdded, onCancel }) => {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<Category>('Food');
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [dateVal, setDateVal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const setDateOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setDateVal(d.toISOString().slice(0, 10));
  };

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setAmount(preset.amount.toString());
    setCategory(preset.category);
    setNote(preset.note);
    setMode(preset.mode);
  };

  const handleNoteChange = (text: string) => {
    setNote(text);
    // Smart auto-categorization
    const lower = text.toLowerCase();
    if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('food') || lower.includes('tea') || lower.includes('coffee') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('pizza') || lower.includes('biryani')) {
      setCategory('Food');
    } else if (lower.includes('uber') || lower.includes('ola') || lower.includes('metro') || lower.includes('rapido') || lower.includes('fuel') || lower.includes('petrol') || lower.includes('auto')) {
      setCategory('Transport');
    } else if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('myntra') || lower.includes('clothes') || lower.includes('shoes') || lower.includes('mall')) {
      setCategory('Shopping');
    } else if (lower.includes('electricity') || lower.includes('wifi') || lower.includes('broadband') || lower.includes('airtel') || lower.includes('jio') || lower.includes('water bill') || lower.includes('gas')) {
      setCategory('Bills');
    } else if (lower.includes('doctor') || lower.includes('pharmacy') || lower.includes('medicine') || lower.includes('hospital') || lower.includes('apollo')) {
      setCategory('Health');
    } else if (lower.includes('movie') || lower.includes('netflix') || lower.includes('spotify') || lower.includes('cinema') || lower.includes('game') || lower.includes('steam')) {
      setCategory('Entertainment');
    } else if (lower.includes('rent') || lower.includes('flat') || lower.includes('pg') || lower.includes('landlord')) {
      setCategory('Rent');
    } else if (lower.includes('book') || lower.includes('course') || lower.includes('tuition') || lower.includes('udemy')) {
      setCategory('Books');
    }
  };

  const handleVoiceData = (data: { amount: number; category: string; note: string; mode: PaymentMode }) => {
    setAmount(data.amount.toString());
    if (CATEGORIES.includes(data.category as Category)) {
      setCategory(data.category as Category);
    }
    setNote(data.note);
    setMode(data.mode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount greater than 0.');
      return;
    }

    try {
      db.addExpense(dateVal, numericAmount, category, note, mode);
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate?.(50);
      }
      setSuccessMsg(`✓ Saved ₹${numericAmount.toLocaleString('en-IN')} on ${category}!`);
      setAmount('');
      setNote('');
      onExpenseAdded();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hands-Free Voice Logger Header */}
      <VoiceExpenseInput onParsedExpense={handleVoiceData} />

      {/* Main Expense Form Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Add Expense</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Log daily UPI, card, or cash spends with instant budget synchronization
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-2"
            >
              Cancel
            </button>
          )}
        </div>

        {/* 1-Tap Daily Presets Strip */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Quick 1-Tap Presets
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PRESETS.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="shrink-0 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
                <span className="font-mono text-indigo-700 font-bold">₹{p.amount}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Large Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-400 font-mono select-none">
                ₹
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-3xl sm:text-4xl font-black font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Category Touch Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Select Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {CATEGORY_CHIPS.map(c => {
                const isSelected = category === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-xs font-bold tracking-tight">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Selector & Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Date
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDateOffset(0)}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDateOffset(1)}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dateVal}
              onChange={e => setDateVal(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_MODES.map(m => {
                const isSelected = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-extrabold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note / Description with Auto-Categorization hint */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Note / Description (Optional)
              </label>
              <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Auto-categorizes keywords</span>
              </span>
            </div>
            <input
              type="text"
              value={note}
              onChange={e => handleNoteChange(e.target.value)}
              placeholder="e.g. Swiggy lunch, Uber cab, Grocery at D-Mart"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-[#d4ff3f]" />
            <span>Save Expense</span>
          </button>
        </form>
      </div>
    </div>
  );
};
