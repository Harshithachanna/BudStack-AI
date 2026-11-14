import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import type { Timestamp, Unsubscribe } from 'firebase/firestore';
import type { AIInsightRecord, InsightType } from '../types/finance';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface InsightRequestSummary {
  periodLabel: string;
  currency: string;
  insightType: InsightType;
  totalIncomeINR: number;
  totalExpensesINR: number;
  totalSavingsINR: number;
  savingsRatePercent: number | null;
  transactionCount: number;
  previousMonth: {
    hasData: boolean;
    label: string;
    totalIncomeINR: number;
    totalExpensesINR: number;
    expenseChangePercent: number | null;
  };
  categoryExpenses: Array<{
    category: string;
    amountINR: number;
    sharePercent: number;
  }>;
  budgets: Array<{
    category: string;
    limitINR: number;
    spentINR: number;
    utilizationPercent: number;
  }>;
  monthlyTrend: Array<{
    monthLabel: string;
    incomeINR: number;
    expensesINR: number;
  }>;
  forecast: {
    hasEnoughHistory: boolean;
    averageMonthlyExpenseINR: number | null;
    monthsUsed: number;
  };
}

function parseDateTimestamp(val: unknown): Date | null {
  if (!val) return null;
  if (typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate();
  }
  return null;
}

export function subscribeInsights(
  uid: string,
  onData: (insights: AIInsightRecord[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const colPath = `users/${uid}/insights`;
  const q = query(collection(db, 'users', uid, 'insights'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AIInsightRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(d.userId ?? uid),
          period: String(d.period ?? ''),
          insightType: (d.insightType as InsightType) ?? 'monthly_comprehensive',
          summary: String(d.summary ?? ''),
          observations: Array.isArray(d.observations) ? d.observations.map(String) : [],
          unusualSpending: Array.isArray(d.unusualSpending) ? d.unusualSpending.map(String) : [],
          savingsSuggestions: Array.isArray(d.savingsSuggestions)
            ? d.savingsSuggestions.map(String)
            : [],
          budgetRecommendations: Array.isArray(d.budgetRecommendations)
            ? d.budgetRecommendations.map(String)
            : [],
          disclaimer: String(d.disclaimer ?? ''),
          generatedAt: parseDateTimestamp(d.generatedAt),
        };
      });

      items.sort((a, b) => {
        const tA = a.generatedAt?.getTime() ?? 0;
        const tB = b.generatedAt?.getTime() ?? 0;
        return tB - tA;
      });

      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export async function generateAndSaveInsight(
  user: User,
  payload: InsightRequestSummary,
): Promise<string> {
  const idToken = await user.getIdToken();
  const response = await fetch('/api/insights/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as {
    insights?: {
      summary: string;
      observations: string[];
      unusualSpending: string[];
      savingsSuggestions: string[];
      budgetRecommendations: string[];
      disclaimer: string;
    };
    error?: string;
  };

  if (!response.ok || !data.insights) {
    throw new Error(data.error || 'Failed to generate AI financial insights.');
  }

  const colPath = `users/${user.uid}/insights`;
  try {
    const docRef = await addDoc(collection(db, 'users', user.uid, 'insights'), {
      userId: user.uid,
      period: payload.periodLabel.slice(0, 40),
      insightType: payload.insightType,
      summary: data.insights.summary.slice(0, 2000),
      observations: data.insights.observations.slice(0, 10),
      unusualSpending: data.insights.unusualSpending.slice(0, 10),
      savingsSuggestions: data.insights.savingsSuggestions.slice(0, 10),
      budgetRecommendations: data.insights.budgetRecommendations.slice(0, 10),
      disclaimer: data.insights.disclaimer.slice(0, 500),
      generatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function deleteInsight(uid: string, insightId: string): Promise<void> {
  const docPath = `users/${uid}/insights/${insightId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'insights', insightId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
