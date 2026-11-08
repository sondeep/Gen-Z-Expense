export interface Expense {
  id: number;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  note: string;
  payment_mode: 'UPI' | 'Card' | 'Cash' | 'Net Banking';
}

export interface Budget {
  category: string;
  monthly_limit: number;
}

export interface BudgetStatusRow {
  category: string;
  spent: number;
  limit: number;
  used_pct: number;
  status: 'OK' | 'Warning' | 'Over';
}

export interface AnomalyExpense extends Expense {
  mean: number;
  std: number;
  zScore: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'yearly';
  dayOfMonth: number;
  payment_mode: 'UPI' | 'Card' | 'Cash' | 'Net Banking';
  isActive: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  emoji: string;
}

export interface FinancialHealth {
  score: number; // 0 - 100
  grade: 'Excellent' | 'Good' | 'Attention' | 'At Risk';
  title: string;
  summary: string;
  tips: string[];
}

export interface TestCase {
  id: string;
  name: string;
  inputDescription: string;
  expectedResult: string;
  status: 'passed' | 'failed' | 'idle';
  actualResult?: string;
  durationMs?: number;
  run: () => { passed: boolean; message: string };
}

export interface TeamMember {
  roleNumber: number;
  title: string;
  area: string;
  owns: string[];
  tasks: string[];
  isUserRole: boolean;
  speakerTime: string;
  slides: string;
}

export interface PresentationSlide {
  id: number;
  title: string;
  speaker: string;
  speakerRole: string;
  duration: string;
  keyPoints: string[];
  technicalDetails: string[];
  visualMockup: string;
}

export interface VivaQuestion {
  id: number;
  category: string;
  role: string;
  question: string;
  shortAnswer: string;
  inDepthExplanation: string;
  sampleCodeOrFormula?: string;
}
