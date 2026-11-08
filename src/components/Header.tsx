import React from 'react';
import { LayoutDashboard, PlusCircle, BarChart3, Target, Calendar, PiggyBank } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add', label: 'Add Expense', icon: PlusCircle },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'subscriptions', label: 'Subscriptions', icon: Calendar },
    { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer select-none"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#1b1340] text-[#d4ff3f] flex items-center justify-center font-black text-xs sm:text-sm shadow-xs">
            ₹
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
              GenZ Expense
            </h1>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#d4ff3f]' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions & PWA Install */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />
          <button
            onClick={onOpenQuickAdd}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-[#6c4cf1] hover:bg-[#5b3ce0] rounded-xl shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#d4ff3f]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
