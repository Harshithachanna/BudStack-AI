import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Edit2, PlusCircle, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { useFinanceData } from '../context/FinanceDataContext';
import { useToast } from '../context/ToastContext';
import {
  createBudget,
  deleteBudget,
  updateBudgetLimit,
} from '../services/budgetService';
import { EXPENSE_CATEGORIES } from '../types/finance';
import type { BudgetWithUsage, ExpenseCategory } from '../types/finance';
import { computeBudgetsWithUsage } from '../utils/calculations';
import {
  formatCurrencyFromPaise,
  getKolkataCurrentMonthYear,
  getMonthLabel,
  getPreviousMonthYear,
} from '../utils/formatters';

export function BudgetsPage() {
  const { user, profile } = useAuth();
  const { budgets, transactions, loading } = useFinanceData();
  const { showSuccess, showError } = useToast();

  const currentMY = getKolkataCurrentMonthYear();
  const [selectedYear, setSelectedYear] = useState(currentMY.year);
  const [selectedMonth, setSelectedMonth] = useState(currentMY.month);

  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [limitAmount, setLimitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingBudget, setEditingBudget] = useState<BudgetWithUsage | null>(null);
  const [editLimitValue, setEditLimitValue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingBudget, setDeletingBudget] = useState<BudgetWithUsage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currency = profile?.preferredCurrency ?? 'INR';

  const monthOptions = useMemo(() => {
    const opts: Array<{ year: number; month: number; label: string }> = [];
    let y = currentMY.year;
    let m = currentMY.month;
    for (let i = 0; i < 12; i++) {
      opts.push({ year: y, month: m, label: getMonthLabel(y, m) });
      const prev = getPreviousMonthYear(y, m);
      y = prev.year;
      m = prev.month;
    }
    return opts;
  }, [currentMY.year, currentMY.month]);

  const budgetsWithUsage = useMemo(
    () => computeBudgetsWithUsage(budgets, transactions, selectedYear, selectedMonth),
    [budgets, transactions, selectedYear, selectedMonth],
  );

  const totalBudgetedPaise = useMemo(
    () => budgetsWithUsage.reduce((acc, b) => acc + b.monthlyLimitPaise, 0),
    [budgetsWithUsage],
  );
  const totalSpentInBudgetsPaise = useMemo(
    () => budgetsWithUsage.reduce((acc, b) => acc + b.spentPaise, 0),
    [budgetsWithUsage],
  );

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    const parsedLimit = Number(limitAmount);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      setFormError('Monthly spending limit must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      await createBudget(user.uid, {
        category,
        monthlyLimitRupees: parsedLimit,
        month: selectedMonth,
        year: selectedYear,
      });
      showSuccess(`Budget created for ${category} (${getMonthLabel(selectedYear, selectedMonth)}).`);
      setLimitAmount('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create budget.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingBudget) return;

    const parsed = Number(editLimitValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showError('Budget limit must be greater than zero.');
      return;
    }

    setSavingEdit(true);
    try {
      await updateBudgetLimit(user.uid, editingBudget.id, parsed);
      showSuccess(`Updated ${editingBudget.category} budget limit.`);
      setEditingBudget(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to update budget.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingBudget) return;
    setDeleting(true);
    try {
      await deleteBudget(user.uid, deletingBudget.id);
      showSuccess(`Deleted ${deletingBudget.category} budget.`);
      setDeletingBudget(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to delete budget.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell
      title="Monthly Budgets"
      subtitle={`Set category limits and monitor real-time spending alerts for ${getMonthLabel(selectedYear, selectedMonth)}`}
    >
      <div className="space-y-6">
        {/* Top Controls & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Budget Form */}
          <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Create Category Budget
              </h2>
              <select
                aria-label="Budget month"
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setSelectedYear(y);
                  setSelectedMonth(m);
                }}
                className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC]"
              >
                {monthOptions.map((opt) => (
                  <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-3.5 py-2.5 text-xs text-[#DC2626]"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label
                  htmlFor="budget-category"
                  className="block text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1.5"
                >
                  Expense Category
                </label>
                <select
                  id="budget-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC]"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="budget-limit"
                  className="block text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1.5"
                >
                  Monthly Spending Limit (₹)
                </label>
                <input
                  id="budget-limit"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 5000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <PlusCircle className="h-4 w-4" />
                {submitting ? 'Creating Budget...' : 'Set Monthly Budget'}
              </button>
            </form>
          </div>

          {/* Summary Metrics */}
          <div className="lg:col-span-7 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {getMonthLabel(selectedYear, selectedMonth)} Budget Summary
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                Only recorded expense transactions in each category count toward utilization.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 p-4">
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Total Budgeted</p>
                  <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                    {formatCurrencyFromPaise(totalBudgetedPaise, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 p-4">
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Spent Against Budgets</p>
                  <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                    {formatCurrencyFromPaise(totalSpentInBudgetsPaise, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 p-4">
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Remaining</p>
                  <p
                    className={`mt-1.5 text-xl font-bold font-mono tabular-nums ${
                      totalBudgetedPaise - totalSpentInBudgetsPaise >= 0
                        ? 'text-[#16A34A]'
                        : 'text-[#DC2626]'
                    }`}
                  >
                    {formatCurrencyFromPaise(
                      totalBudgetedPaise - totalSpentInBudgetsPaise,
                      currency,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-wrap gap-4 text-xs text-[#64748B] dark:text-slate-400">
              <span>Alert thresholds:</span>
              <span className="text-[#16A34A] font-medium">&lt; 75% On Track</span>
              <span className="text-[#F59E0B] font-medium">75%–89% Warning</span>
              <span className="text-[#EA580C] font-medium">90%–100% Critical</span>
              <span className="text-[#DC2626] font-medium">&gt; 100% Exceeded</span>
            </div>
          </div>
        </div>

        {/* Budget Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-44 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827]"
              />
            ))}
          </div>
        ) : budgetsWithUsage.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
            <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              No budgets set for {getMonthLabel(selectedYear, selectedMonth)}
            </h3>
            <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-400">
              Use the form above to set a monthly spending cap for categories like Food, Housing,
              or Transportation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgetsWithUsage.map((b) => {
              const statusMeta =
                b.status === 'exceeded'
                  ? {
                      label: 'Budget Exceeded (>100%)',
                      textClass: 'text-[#DC2626]',
                      barClass: 'bg-[#DC2626]',
                      icon: AlertTriangle,
                    }
                  : b.status === 'critical'
                    ? {
                        label: 'Critical Alert (90%+)',
                        textClass: 'text-[#EA580C]',
                        barClass: 'bg-[#EA580C]',
                        icon: AlertTriangle,
                      }
                    : b.status === 'warning'
                      ? {
                          label: 'Warning (75%+)',
                          textClass: 'text-[#F59E0B]',
                          barClass: 'bg-[#F59E0B]',
                          icon: AlertTriangle,
                        }
                      : {
                          label: 'On Track',
                          textClass: 'text-[#16A34A]',
                          barClass: 'bg-[#16A34A]',
                          icon: CheckCircle2,
                        };

              const StatusIcon = statusMeta.icon;

              return (
                <div
                  key={b.id}
                  className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          {b.category}
                        </h3>
                        <p
                          className={`mt-1 inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.textClass}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusMeta.label}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBudget(b);
                            setEditLimitValue(String(b.monthlyLimitPaise / 100));
                          }}
                          aria-label={`Edit ${b.category} budget`}
                          className="p-1.5 rounded-md text-[#64748B] hover:text-[#2563EB] hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingBudget(b)}
                          aria-label={`Delete ${b.category} budget`}
                          className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#64748B] dark:text-slate-400">Monthly Limit</span>
                        <span className="font-mono tabular-nums font-medium text-[#0F172A] dark:text-slate-100">
                          {formatCurrencyFromPaise(b.monthlyLimitPaise, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] dark:text-slate-400">Spent</span>
                        <span className="font-mono tabular-nums font-medium text-[#0F172A] dark:text-slate-100">
                          {formatCurrencyFromPaise(b.spentPaise, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] dark:text-slate-400">
                          {b.remainingPaise >= 0 ? 'Remaining' : 'Over by'}
                        </span>
                        <span
                          className={`font-mono tabular-nums font-semibold ${
                            b.remainingPaise >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {formatCurrencyFromPaise(Math.abs(b.remainingPaise), currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#64748B] dark:text-slate-400">Utilization</span>
                      <span className={`font-mono tabular-nums font-semibold ${statusMeta.textClass}`}>
                        {b.utilizationPercent}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${statusMeta.barClass}`}
                        style={{ width: `${Math.min(100, b.utilizationPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-xl">
            <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              Edit {editingBudget.category} Budget
            </h3>
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
              {getMonthLabel(editingBudget.year, editingBudget.month)}
            </p>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="edit-budget-limit"
                  className="block text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1.5"
                >
                  Monthly Limit (₹)
                </label>
                <input
                  id="edit-budget-limit"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={editLimitValue}
                  onChange={(e) => setEditLimitValue(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  disabled={savingEdit}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-4 py-2 text-sm font-medium text-[#0F172A] dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingBudget)}
        title="Delete budget?"
        description={
          deletingBudget
            ? `Remove the ${deletingBudget.category} budget for ${getMonthLabel(deletingBudget.year, deletingBudget.month)}? Your underlying transactions will not be affected.`
            : ''
        }
        confirmLabel="Delete Budget"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingBudget(null)}
      />
    </AppShell>
  );
}
