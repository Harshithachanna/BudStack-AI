import React, { useEffect, useState } from 'react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../../types/finance';
import type {
  Transaction,
  TransactionCategory,
  TransactionInput,
  TransactionType,
} from '../../types/finance';
import { getKolkataTodayISO } from '../../utils/formatters';

interface TransactionFormProps {
  initialTransaction?: Transaction | null;
  submitLabel?: string;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCancel?: () => void;
}

export function TransactionForm({
  initialTransaction,
  submitLabel,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialTransaction?.type ?? 'expense');
  const [amount, setAmount] = useState<string>(
    initialTransaction ? String(initialTransaction.amountPaise / 100) : '',
  );
  const [category, setCategory] = useState<TransactionCategory>(
    initialTransaction?.category ?? 'Food',
  );
  const [description, setDescription] = useState<string>(
    initialTransaction?.description ?? '',
  );
  const [transactionDate, setTransactionDate] = useState<string>(
    initialTransaction?.transactionDate ?? getKolkataTodayISO(),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(String(initialTransaction.amountPaise / 100));
      setCategory(initialTransaction.category);
      setDescription(initialTransaction.description);
      setTransactionDate(initialTransaction.transactionDate);
    }
  }, [initialTransaction]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const list: readonly string[] = nextType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!list.includes(category)) {
      setCategory(nextType === 'income' ? 'Salary' : 'Food');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please enter a brief description for this transaction.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      setFormError('Please select a valid transaction date.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amountRupees: parsedAmount,
        type,
        category,
        description: description.trim(),
        transactionDate,
        isSample: initialTransaction?.isSample ?? false,
      });
      if (!initialTransaction) {
        setAmount('');
        setDescription('');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-4 py-3 text-sm text-[#DC2626]"
        >
          {formError}
        </div>
      )}

      <div>
        <span className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-2">
          Transaction Type
        </span>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              type === 'expense'
                ? 'bg-white dark:bg-[#1E293B] text-[#DC2626] shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              type === 'income'
                ? 'bg-white dark:bg-[#1E293B] text-[#16A34A] shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="tx-amount"
            className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
          >
            Amount (₹)
          </label>
          <input
            id="tx-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </div>

        <div>
          <label
            htmlFor="tx-date"
            className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
          >
            Transaction Date
          </label>
          <input
            id="tx-date"
            type="date"
            required
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="tx-category"
          className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
        >
          Category
        </label>
        <select
          id="tx-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as TransactionCategory)}
          className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
        >
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="tx-description"
          className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
        >
          Description
        </label>
        <input
          id="tx-description"
          type="text"
          maxLength={250}
          required
          placeholder={
            type === 'income'
              ? 'e.g., Monthly salary credit or freelance project'
              : 'e.g., Grocery shopping, metro pass, or dinner'
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
        />
        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
          {description.length}/250 characters
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {submitting
            ? 'Saving...'
            : submitLabel ?? (initialTransaction ? 'Save Changes' : 'Add Transaction')}
        </button>
      </div>
    </form>
  );
}
