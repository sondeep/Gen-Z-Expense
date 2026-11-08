import React, { useState } from 'react';
import { X, Check, Plus, Sparkles } from 'lucide-react';
import { ExpenseDatabase, CATEGORIES, Category, PAYMENT_MODES, PaymentMode } from '../utils/expenseCore';
import { VoiceExpenseInput } from './VoiceExpenseInput';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: ExpenseDatabase;
  onExpenseAdded: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  db,
  onExpenseAdded,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<Category>('Food');
  const [note, setNote] = useState<string>('');
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Enter a valid amount greater than 0');
      return;
    }

    try {
      db.addExpense(date, parsedAmt, category, note, mode);
      setIsSuccess(true);
      onExpenseAdded();
      setTimeout(() => {
        setIsSuccess(false);
        setAmount('');
        setNote('');
        onClose();
      }, 500);
    } catch (err: unknown) {
      setError((err as Error).message);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#6c4cf1] text-[#d4ff3f] flex items-center justify-center font-bold">
              ₹
            </div>
            <div>
              <h3 className="text-sm font-bold">Log New Expense</h3>
              <p className="text-[10px] text-slate-400">Quick &amp; easy expense logging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <VoiceExpenseInput onParsedExpense={handleVoiceData} />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* Amount input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 text-xl font-bold font-mono bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none rounded-2xl text-slate-900"
                />
              </div>
            </div>

            {/* Category Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      category === cat
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_MODES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-1.5 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                      mode === m
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Note & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note / Merchant
                </label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy Lunch"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSuccess}
                className="flex-1 py-2.5 rounded-xl bg-[#6c4cf1] hover:bg-[#5b3ce0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                {isSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-[#d4ff3f]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#d4ff3f]" />
                    <span>Save Transaction</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
