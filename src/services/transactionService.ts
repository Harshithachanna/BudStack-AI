import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { Timestamp, Unsubscribe } from 'firebase/firestore';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../types/finance';
import type {
  Transaction,
  TransactionCategory,
  TransactionInput,
  TransactionType,
} from '../types/finance';
import { getKolkataCurrentMonthYear, getPreviousMonthYear } from '../utils/formatters';
import { db, handleFirestoreError, OperationType } from './firebase';

function parseDateTimestamp(val: unknown): Date | null {
  if (!val) return null;
  if (typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate();
  }
  return null;
}

export function validateTransactionInput(input: TransactionInput): {
  amountPaise: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  transactionDate: string;
  month: number;
  year: number;
  isSample: boolean;
} {
  if (!Number.isFinite(input.amountRupees) || input.amountRupees <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  const amountPaise = Math.round(input.amountRupees * 100);
  if (amountPaise <= 0 || amountPaise > 100000000000) {
    throw new Error('Amount is outside supported limits.');
  }

  if (input.type !== 'income' && input.type !== 'expense') {
    throw new Error('Transaction type must be Income or Expense.');
  }

  const allowedCategories: readonly string[] =
    input.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!allowedCategories.includes(input.category)) {
    throw new Error(`Invalid category "${input.category}" for ${input.type}.`);
  }

  const description = input.description.trim().slice(0, 250);
  if (!description) {
    throw new Error('Description is required.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.transactionDate)) {
    throw new Error('Transaction date must be in YYYY-MM-DD format.');
  }

  const [year, month, day] = input.transactionDate.split('-').map(Number);
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('Please enter a valid transaction date.');
  }

  return {
    amountPaise,
    type: input.type,
    category: input.category,
    description,
    transactionDate: input.transactionDate,
    month,
    year,
    isSample: Boolean(input.isSample),
  };
}

export function subscribeTransactions(
  uid: string,
  onData: (transactions: Transaction[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const colPath = `users/${uid}/transactions`;
  const q = query(collection(db, 'users', uid, 'transactions'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(d.userId ?? uid),
          amountPaise: Number(d.amountPaise ?? 0),
          type: (d.type as TransactionType) ?? 'expense',
          category: (d.category as TransactionCategory) ?? 'Other',
          description: String(d.description ?? ''),
          transactionDate: String(d.transactionDate ?? ''),
          month: Number(d.month ?? 1),
          year: Number(d.year ?? 2026),
          isSample: Boolean(d.isSample ?? false),
          createdAt: parseDateTimestamp(d.createdAt),
          updatedAt: parseDateTimestamp(d.updatedAt),
        };
      });

      items.sort((a, b) => {
        const dateCmp = b.transactionDate.localeCompare(a.transactionDate);
        if (dateCmp !== 0) return dateCmp;
        const tA = a.createdAt?.getTime() ?? 0;
        const tB = b.createdAt?.getTime() ?? 0;
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

export async function createTransaction(uid: string, input: TransactionInput): Promise<string> {
  const colPath = `users/${uid}/transactions`;
  const validated = validateTransactionInput(input);

  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'transactions'), {
      userId: uid,
      ...validated,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateTransaction(
  uid: string,
  transactionId: string,
  input: TransactionInput,
): Promise<void> {
  const docPath = `users/${uid}/transactions/${transactionId}`;
  const validated = validateTransactionInput(input);

  try {
    await updateDoc(doc(db, 'users', uid, 'transactions', transactionId), {
      amountPaise: validated.amountPaise,
      type: validated.type,
      category: validated.category,
      description: validated.description,
      transactionDate: validated.transactionDate,
      month: validated.month,
      year: validated.year,
      isSample: validated.isSample,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteTransaction(uid: string, transactionId: string): Promise<void> {
  const docPath = `users/${uid}/transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'transactions', transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function loadSampleTransactions(uid: string): Promise<number> {
  const colPath = `users/${uid}/transactions`;
  const current = getKolkataCurrentMonthYear();
  const prev1 = getPreviousMonthYear(current.year, current.month);
  const prev2 = getPreviousMonthYear(prev1.year, prev1.month);
  const prev3 = getPreviousMonthYear(prev2.year, prev2.month);

  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const sampleItems: TransactionInput[] = [
    // 3 months ago
    { amountRupees: 48000, type: 'income', category: 'Salary', description: 'Monthly stipend & internship salary', transactionDate: fmt(prev3.year, prev3.month, 2), isSample: true },
    { amountRupees: 11500, type: 'expense', category: 'Housing', description: 'Shared PG & utility split', transactionDate: fmt(prev3.year, prev3.month, 4), isSample: true },
    { amountRupees: 4800, type: 'expense', category: 'Food', description: 'Tiffin & campus dining', transactionDate: fmt(prev3.year, prev3.month, 10), isSample: true },
    { amountRupees: 2400, type: 'expense', category: 'Transportation', description: 'Metro card & cab commutes', transactionDate: fmt(prev3.year, prev3.month, 15), isSample: true },
    { amountRupees: 1850, type: 'expense', category: 'Bills', description: 'Mobile, WiFi & electricity share', transactionDate: fmt(prev3.year, prev3.month, 20), isSample: true },

    // 2 months ago
    { amountRupees: 48000, type: 'income', category: 'Salary', description: 'Monthly salary credit', transactionDate: fmt(prev2.year, prev2.month, 2), isSample: true },
    { amountRupees: 8500, type: 'income', category: 'Freelancing', description: 'UI audit freelance sprint', transactionDate: fmt(prev2.year, prev2.month, 14), isSample: true },
    { amountRupees: 11500, type: 'expense', category: 'Housing', description: 'Monthly rent & maintenance', transactionDate: fmt(prev2.year, prev2.month, 4), isSample: true },
    { amountRupees: 5400, type: 'expense', category: 'Food', description: 'Meals & weekend coffee meetups', transactionDate: fmt(prev2.year, prev2.month, 11), isSample: true },
    { amountRupees: 3200, type: 'expense', category: 'Education', description: 'Technical certification exam fee', transactionDate: fmt(prev2.year, prev2.month, 18), isSample: true },
    { amountRupees: 2900, type: 'expense', category: 'Groceries', description: 'Monthly essentials & pantry restock', transactionDate: fmt(prev2.year, prev2.month, 22), isSample: true },

    // Previous month
    { amountRupees: 52000, type: 'income', category: 'Salary', description: 'Monthly salary credit', transactionDate: fmt(prev1.year, prev1.month, 2), isSample: true },
    { amountRupees: 11500, type: 'expense', category: 'Housing', description: 'Monthly rent & maintenance', transactionDate: fmt(prev1.year, prev1.month, 4), isSample: true },
    { amountRupees: 6200, type: 'expense', category: 'Food', description: 'Dining & team lunches', transactionDate: fmt(prev1.year, prev1.month, 9), isSample: true },
    { amountRupees: 3900, type: 'expense', category: 'Shopping', description: 'Running shoes & workstation accessories', transactionDate: fmt(prev1.year, prev1.month, 16), isSample: true },
    { amountRupees: 2100, type: 'expense', category: 'Transportation', description: 'Metro pass & airport shuttle', transactionDate: fmt(prev1.year, prev1.month, 21), isSample: true },
    { amountRupees: 1950, type: 'expense', category: 'Bills', description: 'Broadband & phone recharge', transactionDate: fmt(prev1.year, prev1.month, 24), isSample: true },

    // Current month
    { amountRupees: 52000, type: 'income', category: 'Salary', description: 'Monthly salary credit', transactionDate: fmt(current.year, current.month, 2), isSample: true },
    { amountRupees: 6000, type: 'income', category: 'Freelancing', description: 'React component consulting', transactionDate: fmt(current.year, current.month, 7), isSample: true },
    { amountRupees: 11500, type: 'expense', category: 'Housing', description: 'Monthly rent & maintenance', transactionDate: fmt(current.year, current.month, 3), isSample: true },
    { amountRupees: 4350, type: 'expense', category: 'Food', description: 'Lunch plan & groceries delivery', transactionDate: fmt(current.year, current.month, 6), isSample: true },
    { amountRupees: 1900, type: 'expense', category: 'Transportation', description: 'Monthly metro card top-up', transactionDate: fmt(current.year, current.month, 8), isSample: true },
    { amountRupees: 1450, type: 'expense', category: 'Healthcare', description: 'Annual health checkup & pharmacy', transactionDate: fmt(current.year, current.month, 10), isSample: true },
    { amountRupees: 1200, type: 'expense', category: 'Entertainment', description: 'Streaming & weekend cinema', transactionDate: fmt(current.year, current.month, 12), isSample: true },
  ];

  try {
    const batch = writeBatch(db);
    const colRef = collection(db, 'users', uid, 'transactions');

    for (const item of sampleItems) {
      const validated = validateTransactionInput(item);
      const newDoc = doc(colRef);
      batch.set(newDoc, {
        userId: uid,
        ...validated,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return sampleItems.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, colPath);
  }
}

export async function clearSampleTransactions(
  uid: string,
  transactions: Transaction[],
): Promise<number> {
  const sampleDocs = transactions.filter((tx) => tx.isSample);
  if (sampleDocs.length === 0) return 0;

  const colPath = `users/${uid}/transactions`;
  try {
    const batch = writeBatch(db);
    for (const tx of sampleDocs) {
      batch.delete(doc(db, 'users', uid, 'transactions', tx.id));
    }
    await batch.commit();
    return sampleDocs.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, colPath);
  }
}
