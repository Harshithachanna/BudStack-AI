import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Timestamp, Unsubscribe } from 'firebase/firestore';
import { EXPENSE_CATEGORIES } from '../types/finance';
import type { Budget, BudgetInput, ExpenseCategory } from '../types/finance';
import { getMonthLabel, toBudgetDocId } from '../utils/formatters';
import { db, handleFirestoreError, OperationType } from './firebase';

function parseDateTimestamp(val: unknown): Date | null {
  if (!val) return null;
  if (typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate();
  }
  return null;
}

export function subscribeBudgets(
  uid: string,
  onData: (budgets: Budget[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const colPath = `users/${uid}/budgets`;
  const q = query(collection(db, 'users', uid, 'budgets'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Budget[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(d.userId ?? uid),
          category: (d.category as ExpenseCategory) ?? 'Other',
          monthlyLimitPaise: Number(d.monthlyLimitPaise ?? 0),
          month: Number(d.month ?? 1),
          year: Number(d.year ?? 2026),
          createdAt: parseDateTimestamp(d.createdAt),
          updatedAt: parseDateTimestamp(d.updatedAt),
        };
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

export async function createBudget(uid: string, input: BudgetInput): Promise<string> {
  if (!EXPENSE_CATEGORIES.includes(input.category)) {
    throw new Error('Please choose a valid expense category.');
  }
  if (!Number.isFinite(input.monthlyLimitRupees) || input.monthlyLimitRupees <= 0) {
    throw new Error('Monthly budget limit must be greater than zero.');
  }
  const monthlyLimitPaise = Math.round(input.monthlyLimitRupees * 100);
  if (monthlyLimitPaise <= 0 || monthlyLimitPaise > 100000000000) {
    throw new Error('Budget limit is outside supported bounds.');
  }

  const budgetId = toBudgetDocId(input.year, input.month, input.category);
  const docPath = `users/${uid}/budgets/${budgetId}`;
  const docRef = doc(db, 'users', uid, 'budgets', budgetId);

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      throw new Error(
        `A budget for ${input.category} in ${getMonthLabel(input.year, input.month)} already exists. Edit the existing budget instead.`,
      );
    }

    await setDoc(docRef, {
      userId: uid,
      category: input.category,
      monthlyLimitPaise,
      month: input.month,
      year: input.year,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return budgetId;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateBudgetLimit(
  uid: string,
  budgetId: string,
  monthlyLimitRupees: number,
): Promise<void> {
  if (!Number.isFinite(monthlyLimitRupees) || monthlyLimitRupees <= 0) {
    throw new Error('Monthly budget limit must be greater than zero.');
  }
  const monthlyLimitPaise = Math.round(monthlyLimitRupees * 100);
  if (monthlyLimitPaise <= 0 || monthlyLimitPaise > 100000000000) {
    throw new Error('Budget limit is outside supported bounds.');
  }

  const docPath = `users/${uid}/budgets/${budgetId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'budgets', budgetId), {
      monthlyLimitPaise,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteBudget(uid: string, budgetId: string): Promise<void> {
  const docPath = `users/${uid}/budgets/${budgetId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'budgets', budgetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
