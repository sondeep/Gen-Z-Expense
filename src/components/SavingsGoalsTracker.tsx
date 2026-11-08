import React, { useState, useMemo } from 'react';
import { Target, Plus, Trash2, TrendingUp, Sparkles, Check, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExpenseDatabase } from '../utils/expenseCore';
import { SavingsGoal } from '../types/project';

interface SavingsGoalsTrackerProps {
  db: ExpenseDatabase;
  onUpdated: () => void;
}

const EMOJI_OPTIONS = ['🛡️', '💻', '🏖️', '🚗', '📱', '🎓', '🏠', '🎁', '⚡', '✈️'];

export const SavingsGoalsTracker: React.FC<SavingsGoalsTrackerProps> = ({ db, onUpdated }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('2027-06-30');
  const [selectedEmoji, setSelectedEmoji] = useState('🛡️');

  // Quick deposit modal
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('500');

  const goals = useMemo(() => db.getSavingsGoals(), [db, onUpdated]);

  const totalSaved = useMemo(() => goals.reduce((sum, g) => sum + g.currentAmount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((sum, g) => sum + g.targetAmount, 0), [goals]);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const initial = parseFloat(initialAmount) || 0;
    if (isNaN(target) || target <= 0 || !name.trim()) return;

    db.addSavingsGoal({
      name: name.trim(),
      targetAmount: target,
      currentAmount: Math.min(target, initial),
      targetDate,
      emoji: selectedEmoji,
    });

    setName('');
    setTargetAmount('');
    setInitialAmount('');
    setShowAddForm(false);
    onUpdated();
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    db.depositToGoal(depositGoal.id, amt);

    if (depositGoal.currentAmount + amt >= depositGoal.targetAmount) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setDepositGoal(null);
    setDepositAmount('500');
    onUpdated();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Hero Savings Progress */}
      <div className="bg-[#1b1340] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Total Accumulated Wealth & Sinking Funds
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-[#d4ff3f] mt-1">
              ₹{totalSaved.toLocaleString('en-IN')}
              <span className="text-sm font-normal text-slate-300"> / ₹{totalTarget.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Overall <strong className="text-white font-bold">{overallProgress}% funded</strong> across {goals.length} target milestones.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6c4cf1] hover:bg-[#5b3ce0] text-white font-bold text-xs shadow-md transition-all self-start md:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#d4ff3f]" />
            <span>Create New Goal</span>
          </button>
        </div>

        {/* Global Progress Track */}
        <div className="mt-5 w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#d4ff3f] rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, overallProgress)}%` }}
          />
        </div>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Create New Savings Milestone</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddGoal} className="space-y-4">
            {/* Emoji Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Milestone Icon</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                      selectedEmoji === emoji
                        ? 'bg-indigo-50 border-indigo-600 scale-110 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next Laptop"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="30000"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Saved (₹)</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={initialAmount}
                  onChange={e => setInitialAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#6c4cf1] hover:bg-[#5b3ce0] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Create Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Deposit Dialog */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-indigo-50 rounded-2xl">{depositGoal.emoji}</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Funds to Goal</h3>
                <p className="text-xs text-slate-500">{depositGoal.name}</p>
              </div>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Amount (₹)</label>
                <input
                  type="number"
                  required
                  autoFocus
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2.5 text-lg font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Fast deposit presets */}
              <div className="flex items-center gap-1.5">
                {[500, 1000, 2500, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt.toString())}
                    className="flex-1 py-1 text-xs font-mono font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-slate-700"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="w-1/2 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#6c4cf1] hover:bg-[#5b3ce0] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map(goal => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    {goal.emoji}
                  </span>
                  <button
                    onClick={() => {
                      db.deleteSavingsGoal(goal.id);
                      onUpdated();
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-3">{goal.name}</h4>
                <div className="flex items-baseline gap-1 mt-1 font-mono">
                  <span className="text-2xl font-black text-slate-900">
                    ₹{goal.currentAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500">
                    / ₹{goal.targetAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{pct}% funded</span>
                    <span>₹{remaining.toLocaleString('en-IN')} left</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setDepositGoal(goal)}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Deposit Funds</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
