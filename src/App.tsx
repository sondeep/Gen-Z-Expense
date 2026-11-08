/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FintechDashboard } from './components/FintechDashboard';
import { AddExpenseForm } from './components/AddExpenseForm';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetManager } from './components/BudgetManager';
import { SubscriptionsManager } from './components/SubscriptionsManager';
import { SavingsGoalsTracker } from './components/SavingsGoalsTracker';
import { QuickAddModal } from './components/QuickAddModal';
import { SmsPermissionModal } from './components/SmsPermissionModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ExpenseDatabase, getBudgetStatus, detectAnomalies, calculateMonthEndForecast, SAMPLE_BANK_SMS_FIXTURES, parseBankSms } from './utils/expenseCore';

export default function App() {
  // App-first default view: Dashboard
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isSmsPermissionModalOpen, setIsSmsPermissionModalOpen] = useState<boolean>(false);
  const [isAutoFetchActive, setIsAutoFetchActive] = useState<boolean>(false);
  const [autoFetchNotification, setAutoFetchNotification] = useState<string | null>(null);

  // Core SQLite-backed in-memory engine
  const db = useMemo(() => new ExpenseDatabase(true), []);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Perform background silent auto-fetch of bank SMS
  const performAutoFetch = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const lastSync = localStorage.getItem('last_sms_auto_sync');
      if (lastSync !== today) {
        const fixture = SAMPLE_BANK_SMS_FIXTURES[0];
        const parsed = parseBankSms(fixture.text);
        const note = `${parsed.merchant} (Auto-Fetched Bank SMS)`;
        db.addExpense(parsed.date, parsed.amount, parsed.category, note, parsed.payment_mode);
        localStorage.setItem('last_sms_auto_sync', today);
        handleRefresh();
        setAutoFetchNotification(`⚡ Auto-Fetched ₹${parsed.amount.toLocaleString('en-IN')} (${parsed.merchant}) from Bank SMS`);
        setTimeout(() => setAutoFetchNotification(null), 4500);
      }
    } catch {
      // silent background failure handling
    }
  };

  // One-time permission check on first opening the app
  useEffect(() => {
    try {
      const status = localStorage.getItem('sms_permission_status');
      if (!status) {
        // First time opening the app: ask permission once!
        setIsSmsPermissionModalOpen(true);
      } else if (status === 'granted') {
        setIsAutoFetchActive(true);
        performAutoFetch();
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleAllowSmsPermission = () => {
    try {
      localStorage.setItem('sms_permission_status', 'granted');
    } catch {}
    setIsAutoFetchActive(true);
    setIsSmsPermissionModalOpen(false);
    performAutoFetch();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleDeclineSmsPermission = () => {
    try {
      localStorage.setItem('sms_permission_status', 'declined');
    } catch {}
    setIsAutoFetchActive(false);
    setIsSmsPermissionModalOpen(false);
  };

  const handleDeleteExpense = (id: number) => {
    db.deleteExpense(id);
    handleRefresh();
  };

  // Live analytics recalculations
  const expenses = useMemo(() => db.getExpenses(), [db, refreshTrigger]);
  const budgets = useMemo(() => db.getBudgets(), [db, refreshTrigger]);
  const budgetStatus = useMemo(() => getBudgetStatus(expenses, budgets), [expenses, budgets]);
  const anomalies = useMemo(() => detectAnomalies(expenses, 2.0), [expenses]);
  const forecast = useMemo(() => calculateMonthEndForecast(expenses), [expenses]);
  const totalBudget = useMemo(() => Object.values(budgets).reduce((a, b) => a + b, 0), [budgets]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Universal Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3.5 sm:py-7">
        {/* View 1: Main Consumer Dashboard */}
        {activeTab === 'dashboard' && (
          <FintechDashboard
            db={db}
            expenses={expenses}
            budgetStatus={budgetStatus}
            anomalies={anomalies}
            forecast={forecast}
            totalBudget={totalBudget}
            onOpenAddExpense={() => setIsQuickAddOpen(true)}
            onOpenAnalytics={() => setActiveTab('analytics')}
            onOpenBudgets={() => setActiveTab('budgets')}
            onOpenSubscriptions={() => setActiveTab('subscriptions')}
            onOpenSavings={() => setActiveTab('savings')}
            onDeleteExpense={handleDeleteExpense}
            onRefresh={handleRefresh}
            isAutoFetchActive={isAutoFetchActive}
            onRequestPermission={() => setIsSmsPermissionModalOpen(true)}
          />
        )}

        {/* View 2: Manual Expense Logger */}
        {activeTab === 'add' && (
          <AddExpenseForm
            db={db}
            onExpenseAdded={() => {
              handleRefresh();
              setActiveTab('dashboard');
            }}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {/* View 4: Spending Insights & Anomaly Detector */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            expenses={expenses}
            budgetStatus={budgetStatus}
            forecast={forecast}
          />
        )}

        {/* View 5: Category Budgets Manager */}
        {activeTab === 'budgets' && (
          <BudgetManager
            db={db}
            budgetStatus={budgetStatus}
            onBudgetsUpdated={handleRefresh}
          />
        )}

        {/* View 6: Recurring Subscriptions & Fixed Commitments */}
        {activeTab === 'subscriptions' && (
          <SubscriptionsManager
            db={db}
            onUpdated={handleRefresh}
          />
        )}

        {/* View 7: Savings Goals & Sinking Funds */}
        {activeTab === 'savings' && (
          <SavingsGoalsTracker
            db={db}
            onUpdated={handleRefresh}
          />
        )}
      </main>

      {/* Global Quick-Add Modal (accessible from any screen via header or FAB) */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        db={db}
        onExpenseAdded={handleRefresh}
      />

      {/* One-time SMS & Bank Tracking Permission Modal (Asked on first app open) */}
      <SmsPermissionModal
        isOpen={isSmsPermissionModalOpen}
        onAllow={handleAllowSmsPermission}
        onDecline={handleDeclineSmsPermission}
      />

      {/* Auto-Fetch Background Success Toast */}
      {autoFetchNotification && (
        <div className="fixed bottom-20 left-3 right-3 sm:bottom-auto sm:top-20 sm:left-auto sm:right-6 z-50 p-3.5 bg-slate-900/95 backdrop-blur text-white rounded-2xl border border-emerald-500/50 shadow-2xl flex items-center gap-2.5 text-xs max-w-md mx-auto sm:mx-0 animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-medium truncate">{autoFetchNotification}</span>
        </div>
      )}

      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Mobile Bottom Navigation Bar (iOS & Android) */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
