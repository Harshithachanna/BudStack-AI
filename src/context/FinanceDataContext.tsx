import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeInsights } from '../services/aiService';
import { subscribeBudgets } from '../services/budgetService';
import { formatFriendlyFirestoreError } from '../services/firebase';
import { subscribeTransactions } from '../services/transactionService';
import type { AIInsightRecord, Budget, Transaction } from '../types/finance';
import { useAuth } from './AuthContext';

interface FinanceDataContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  insights: AIInsightRecord[];
  loading: boolean;
  error: string | null;
  hasSampleData: boolean;
  refreshData: () => void;
}

const FinanceDataContext = createContext<FinanceDataContextValue | undefined>(undefined);

export function FinanceDataProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [insights, setInsights] = useState<AIInsightRecord[]>([]);
  const [txLoaded, setTxLoaded] = useState(false);
  const [budgetsLoaded, setBudgetsLoaded] = useState(false);
  const [insightsLoaded, setInsightsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const isReady = Boolean(user && user.emailVerified && profile);

  useEffect(() => {
    if (!isReady || !user) {
      setTransactions([]);
      setBudgets([]);
      setInsights([]);
      setTxLoaded(false);
      setBudgetsLoaded(false);
      setInsightsLoaded(false);
      setError(null);
      return;
    }

    setError(null);
    setTxLoaded(false);
    setBudgetsLoaded(false);
    setInsightsLoaded(false);

    const unsubTx = subscribeTransactions(
      user.uid,
      (items) => {
        setTransactions(items);
        setTxLoaded(true);
      },
      (err) => {
        setError(formatFriendlyFirestoreError(err));
        setTxLoaded(true);
      },
    );

    const unsubBudgets = subscribeBudgets(
      user.uid,
      (items) => {
        setBudgets(items);
        setBudgetsLoaded(true);
      },
      (err) => {
        setError(formatFriendlyFirestoreError(err));
        setBudgetsLoaded(true);
      },
    );

    const unsubInsights = subscribeInsights(
      user.uid,
      (items) => {
        setInsights(items);
        setInsightsLoaded(true);
      },
      (err) => {
        setError(formatFriendlyFirestoreError(err));
        setInsightsLoaded(true);
      },
    );

    return () => {
      unsubTx();
      unsubBudgets();
      unsubInsights();
    };
  }, [isReady, user, refreshTick]);

  const refreshData = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  const hasSampleData = useMemo(
    () => transactions.some((tx) => tx.isSample),
    [transactions],
  );

  const loading = isReady ? !(txLoaded && budgetsLoaded && insightsLoaded) : false;

  return (
    <FinanceDataContext.Provider
      value={{
        transactions,
        budgets,
        insights,
        loading,
        error,
        hasSampleData,
        refreshData,
      }}
    >
      {children}
    </FinanceDataContext.Provider>
  );
}

export function useFinanceData(): FinanceDataContextValue {
  const ctx = useContext(FinanceDataContext);
  if (!ctx) throw new Error('useFinanceData must be used within FinanceDataProvider');
  return ctx;
}
