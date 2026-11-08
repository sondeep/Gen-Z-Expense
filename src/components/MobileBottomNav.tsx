import React from 'react';
import { LayoutDashboard, PlusCircle, BarChart3, Target, Calendar } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'add', label: 'Add', icon: PlusCircle, isPrimary: true },
    { id: 'subscriptions', label: 'Bills', icon: Calendar },
    { id: 'analytics', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg no-print">
      {tabs.map(t => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;

        if (t.isPrimary) {
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-[#6c4cf1] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-white">
                <Icon className="w-6 h-6 text-[#d4ff3f]" />
              </div>
              <span className="text-[10px] font-bold text-slate-800 mt-0.5">{t.label}</span>
            </button>
          );
        }

        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[56px] ${
              isActive ? 'text-indigo-950 font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-[#6c4cf1]' : 'text-slate-400'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
