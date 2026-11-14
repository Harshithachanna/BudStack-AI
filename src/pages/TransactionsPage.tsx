import React, { useMemo, useState } from 'react';
import {
  Edit2,
  Eye,
  PlusCircle,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { TableSkeleton } from '../components/common/Skeletons';
import { AppShell } from '../components/layout/AppShell';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { useAuth } from '../context/AuthContext';
import { useFinanceData } from '../context/FinanceDataContext';
import { useToast } from '../context/ToastContext';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '../services/transactionService';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../types/finance';
import type { Transaction, TransactionInput } from '../types/finance';
import {
  formatCurrencyFromPaise,
  formatDateTimeKolkata,
  formatDisplayDate,
} from '../utils/formatters';

type TypeFilter = 'all' | 'income' | 'expense';
type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export function TransactionsPage() {
  const { user, profile } = useAuth();
  const { transactions, loading } = useFinanceData();
  const { showSuccess, showError } = useToast();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currency = profile?.preferredCurrency ?? 'INR';

  const allCategories = useMemo(
    () => Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])),
    [],
  );

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      if (startDate && tx.transactionDate < startDate) return false;
      if (endDate && tx.transactionDate > endDate) return false;
      if (q && !tx.description.toLowerCase().includes(q) && !tx.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return a.transactionDate.localeCompare(b.transactionDate);
        case 'amount_desc':
          return b.amountPaise - a.amountPaise;
        case 'amount_asc':
          return a.amountPaise - b.amountPaise;
        case 'date_desc':
        default:
          return b.transactionDate.localeCompare(a.transactionDate);
      }
    });

    return list;
  }, [transactions, typeFilter, categoryFilter, searchQuery, startDate, endDate, sortBy]);

  const handleSaveTransaction = async (input: TransactionInput) => {
    if (!user) return;
    if (modalMode === 'edit' && editingTx) {
      await updateTransaction(user.uid, editingTx.id, input);
      showSuccess('Transaction updated successfully.');
    } else {
      await createTransaction(user.uid, input);
      showSuccess('Transaction added successfully.');
    }
    setModalMode(null);
    setEditingTx(null);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingTx) return;
    setDeleting(true);
    try {
      await deleteTransaction(user.uid, deletingTx.id);
      showSuccess('Transaction deleted.');
      setDeletingTx(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to delete transaction.');
    } finally {
      setDeleting(false);
    }
  };

  const clearAllFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSortBy('date_desc');
  };

  return (
    <AppShell
      title="Transactions"
      subtitle="Manage your complete income and expense ledger"
      actions={
        <button
          type="button"
          onClick={() => {
            setEditingTx(null);
            setModalMode('add');
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          New Transaction
        </button>
      }
    >
      <div className="space-y-5">
        {/* Search & Filter Controls */}
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Segmented Type Filter */}
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 self-start">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'income', label: 'Income Only' },
                  { id: 'expense', label: 'Expenses Only' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    typeFilter === tab.id
                      ? 'bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] shadow-xs'
                      : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by description or category..."
                aria-label="Search transactions"
                className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 pl-9 pr-3 py-2 text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC]"
            >
              <option value="all">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="date"
              aria-label="From date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs text-[#0F172A] dark:text-[#F8FAFC]"
            />

            <input
              type="date"
              aria-label="To date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs text-[#0F172A] dark:text-[#F8FAFC]"
            />

            <div className="flex items-center gap-2">
              <select
                aria-label="Sort transactions"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="flex-1 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC]"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
              {(typeFilter !== 'all' ||
                categoryFilter !== 'all' ||
                searchQuery ||
                startDate ||
                endDate) && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-medium text-[#2563EB] hover:underline whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={7} />
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-12 text-center">
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              {transactions.length === 0
                ? 'No transactions yet. Add your first transaction to get started.'
                : 'No matching transactions found'}
            </h2>
            <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-400">
              {transactions.length === 0
                ? 'Record an income or expense item to begin building your ledger.'
                : 'Try adjusting your search term, category, or date range filters.'}
            </p>
            <div className="mt-5">
              {transactions.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTx(null);
                    setModalMode('add');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add First Transaction
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-4 py-2 text-sm font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold text-[#64748B] dark:text-slate-400">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800/80 text-sm">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-xs text-[#64748B] dark:text-slate-400">
                        {formatDisplayDate(tx.transactionDate)}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-medium text-[#0F172A] dark:text-[#F8FAFC] truncate">
                          {tx.description}
                        </p>
                        {tx.isSample && (
                          <span className="text-[11px] font-medium text-[#F59E0B]">
                            Sample entry
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[#0F172A] dark:text-slate-300">
                        {tx.category}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {tx.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums font-semibold ${
                          tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrencyFromPaise(tx.amountPaise, currency)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingTx(tx)}
                            aria-label={`View details for ${tx.description}`}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#2563EB] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTx(tx);
                              setModalMode('edit');
                            }}
                            aria-label={`Edit ${tx.description}`}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#2563EB] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTx(tx)}
                            aria-label={`Delete ${tx.description}`}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#E2E8F0] dark:border-slate-800 px-4 py-3 text-xs text-[#64748B] dark:text-slate-400">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800 mb-5">
              <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {modalMode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModalMode(null);
                  setEditingTx(null);
                }}
                aria-label="Close modal"
                className="p-1 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <TransactionForm
              initialTransaction={editingTx}
              onSubmit={handleSaveTransaction}
              onCancel={() => {
                setModalMode(null);
                setEditingTx(null);
              }}
            />
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Transaction Details
              </h2>
              <button
                type="button"
                onClick={() => setViewingTx(null)}
                aria-label="Close details"
                className="p-1 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#64748B] dark:text-slate-400">Amount</dt>
                <dd
                  className={`font-mono tabular-nums font-semibold ${
                    viewingTx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}
                >
                  {viewingTx.type === 'income' ? '+' : '-'}
                  {formatCurrencyFromPaise(viewingTx.amountPaise, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#64748B] dark:text-slate-400">Type</dt>
                <dd className="capitalize text-[#0F172A] dark:text-[#F8FAFC]">{viewingTx.type}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#64748B] dark:text-slate-400">Category</dt>
                <dd className="text-[#0F172A] dark:text-[#F8FAFC]">{viewingTx.category}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#64748B] dark:text-slate-400">Date</dt>
                <dd className="text-[#0F172A] dark:text-[#F8FAFC]">
                  {formatDisplayDate(viewingTx.transactionDate)}
                </dd>
              </div>
              <div>
                <dt className="text-[#64748B] dark:text-slate-400">Description</dt>
                <dd className="mt-1 text-[#0F172A] dark:text-[#F8FAFC]">{viewingTx.description}</dd>
              </div>
              <div className="flex justify-between gap-4 pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-xs">
                <dt className="text-[#64748B] dark:text-slate-400">Last Updated</dt>
                <dd className="text-[#64748B] dark:text-slate-400">
                  {formatDateTimeKolkata(viewingTx.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingTx)}
        title="Delete transaction?"
        description={
          deletingTx
            ? `Are you sure you want to delete "${deletingTx.description}" (${formatCurrencyFromPaise(deletingTx.amountPaise, currency)})? Dashboard totals and budgets will recalculate immediately.`
            : ''
        }
        confirmLabel="Delete Transaction"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTx(null)}
      />
    </AppShell>
  );
}
