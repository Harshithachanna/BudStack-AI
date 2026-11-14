export type TransactionType = 'income' | 'expense';

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelancing',
  'Business',
  'Investments',
  'Allowance',
  'Other Income',
] as const;

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Shopping',
  'Education',
  'Healthcare',
  'Entertainment',
  'Housing',
  'Bills',
  'Travel',
  'Groceries',
  'Personal Care',
  'Other',
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type TransactionCategory = IncomeCategory | ExpenseCategory;

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';
export type ThemeMode = 'light' | 'dark';
export type InsightType = 'monthly_comprehensive' | 'spending_alert' | 'budget_review';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  preferredCurrency: CurrencyCode;
  theme: ThemeMode;
  notificationsEnabled: boolean;
  budgetAlertThreshold: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Transaction {
  id: string;
  userId: string;
  amountPaise: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  transactionDate: string; // YYYY-MM-DD
  month: number; // 1-12
  year: number;
  isSample: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TransactionInput {
  amountRupees: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  transactionDate: string;
  isSample?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  category: ExpenseCategory;
  monthlyLimitPaise: number;
  month: number;
  year: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface BudgetInput {
  category: ExpenseCategory;
  monthlyLimitRupees: number;
  month: number;
  year: number;
}

export interface BudgetWithUsage extends Budget {
  spentPaise: number;
  remainingPaise: number;
  utilizationPercent: number;
  status: 'safe' | 'warning' | 'critical' | 'exceeded';
}

export interface AIInsightRecord {
  id: string;
  userId: string;
  period: string;
  insightType: InsightType;
  summary: string;
  observations: string[];
  unusualSpending: string[];
  savingsSuggestions: string[];
  budgetRecommendations: string[];
  disclaimer: string;
  generatedAt?: Date | null;
}

export type AnalyticsDatePreset =
  | 'last_7_days'
  | 'last_30_days'
  | 'current_month'
  | 'previous_month'
  | 'last_6_months'
  | 'last_12_months'
  | 'custom';

export interface MonthlyAggregate {
  key: string; // YYYY-MM
  year: number;
  month: number;
  label: string; // e.g., Nov 2026
  incomePaise: number;
  expensePaise: number;
  savingsPaise: number;
}

export interface CategoryBreakdownItem {
  category: string;
  amountPaise: number;
  sharePercent: number;
  transactionCount: number;
}

export interface ExpenseForecastResult {
  hasEnoughData: boolean;
  monthsAvailable: number;
  monthsRequired: number;
  historicalMonths: Array<{
    key: string;
    label: string;
    expensePaise: number;
  }>;
  estimatedNextMonthPaise: number | null;
  nextMonthLabel: string;
  methodDescription: string;
}
