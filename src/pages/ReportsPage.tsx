import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { ExpenseDistributionChart } from '../components/charts/FinanceCharts';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { useFinanceData } from '../context/FinanceDataContext';
import { useToast } from '../context/ToastContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types/finance';
import {
  buildCategoryExpenseBreakdown,
  calculateTotals,
  filterTransactionsByDateRange,
} from '../utils/calculations';
import { exportTransactionsToCsv } from '../utils/csvExport';
import {
  formatCurrencyFromPaise,
  formatDisplayDate,
  getKolkataTodayISO,
  shiftISOByDays,
} from '../utils/formatters';

type ReportKind =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'income'
  | 'expense'
  | 'category'
  | 'savings';

const REPORT_KINDS: Array<{ id: ReportKind; label: string }> = [
  { id: 'daily', label: 'Daily Report' },
  { id: 'weekly', label: 'Weekly Report' },
  { id: 'monthly', label: 'Monthly Report' },
  { id: 'yearly', label: 'Yearly Report' },
  { id: 'income', label: 'Income Report' },
  { id: 'expense', label: 'Expense Report' },
  { id: 'category', label: 'Category-wise Report' },
  { id: 'savings', label: 'Savings Report' },
];

export function ReportsPage() {
  const { profile } = useAuth();
  const { transactions, loading } = useFinanceData();
  const { showSuccess, showError } = useToast();

  const today = getKolkataTodayISO();
  const currency = profile?.preferredCurrency ?? 'INR';

  const [reportKind, setReportKind] = useState<ReportKind>('monthly');
  const [startDate, setStartDate] = useState(`${today.slice(0, 7)}-01`);
  const [endDate, setEndDate] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allCategories = useMemo(
    () => Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])),
    [],
  );

  const handleReportKindChange = (kind: ReportKind) => {
    setReportKind(kind);
    if (kind === 'daily') {
      setStartDate(today);
      setEndDate(today);
    } else if (kind === 'weekly') {
      setStartDate(shiftISOByDays(today, -6));
      setEndDate(today);
    } else if (kind === 'monthly') {
      setStartDate(`${today.slice(0, 7)}-01`);
      setEndDate(today);
    } else if (kind === 'yearly') {
      setStartDate(`${today.slice(0, 4)}-01-01`);
      setEndDate(today);
    }
  };

  const reportTransactions = useMemo(() => {
    const ranged = filterTransactionsByDateRange(
      transactions,
      startDate <= endDate ? startDate : endDate,
      endDate >= startDate ? endDate : startDate,
    );

    return ranged.filter((tx) => {
      if (reportKind === 'income' && tx.type !== 'income') return false;
      if ((reportKind === 'expense' || reportKind === 'category') && tx.type !== 'expense') {
        return false;
      }
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
      return true;
    });
  }, [transactions, startDate, endDate, reportKind, selectedCategory]);

  const totals = useMemo(() => calculateTotals(reportTransactions), [reportTransactions]);
  const categorySummary = useMemo(
    () => buildCategoryExpenseBreakdown(reportTransactions),
    [reportTransactions],
  );

  const handleDownloadCsv = () => {
    if (reportTransactions.length === 0) {
      showError('No transactions match the selected filters to export.');
      return;
    }
    const filename = `budstack-${reportKind}-report-${startDate}-to-${endDate}.csv`;
    exportTransactionsToCsv(reportTransactions, filename, currency);
    showSuccess(`Exported ${reportTransactions.length} transactions to CSV.`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <AppShell
      title="Financial Reports"
      subtitle="Generate filtered daily, weekly, monthly, yearly, category, and savings statements"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintPdf}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Report Type & Date Filters */}
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {REPORT_KINDS.map((kind) => (
              <button
                key={kind.id}
                type="button"
                onClick={() => handleReportKindChange(kind.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  reportKind === kind.id
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                {kind.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
            <div>
              <label
                htmlFor="rep-start"
                className="block text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1"
              >
                From Date
              </label>
              <input
                id="rep-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs text-[#0F172A] dark:text-[#F8FAFC]"
              />
            </div>

            <div>
              <label
                htmlFor="rep-end"
                className="block text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1"
              >
                To Date
              </label>
              <input
                id="rep-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs text-[#0F172A] dark:text-[#F8FAFC]"
              />
            </div>

            <div>
              <label
                htmlFor="rep-cat"
                className="block text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1"
              >
                Category Filter
              </label>
              <select
                id="rep-cat"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-xs text-[#0F172A] dark:text-[#F8FAFC]"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
            <p className="text-xs text-[#64748B] dark:text-slate-400">Filtered Income</p>
            <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#16A34A]">
              {formatCurrencyFromPaise(totals.incomePaise, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
            <p className="text-xs text-[#64748B] dark:text-slate-400">Filtered Expenses</p>
            <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#DC2626]">
              {formatCurrencyFromPaise(totals.expensePaise, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
            <p className="text-xs text-[#64748B] dark:text-slate-400">Net Savings</p>
            <p
              className={`mt-1.5 text-xl font-bold font-mono tabular-nums ${
                totals.savingsPaise >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}
            >
              {formatCurrencyFromPaise(totals.savingsPaise, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
            <p className="text-xs text-[#64748B] dark:text-slate-400">Savings Rate</p>
            <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
              {totals.savingsRatePercent !== null ? `${totals.savingsRatePercent}%` : '—'}
            </p>
          </div>
        </div>

        {/* Expense Analysis Pie Chart */}
        {categorySummary.length > 0 && reportKind !== 'income' && (
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Expense Analysis (Pie Chart)
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Category share of filtered expenses ({startDate} to {endDate})
              </p>
            </div>
            <ExpenseDistributionChart data={categorySummary} currency={currency} />
          </div>
        )}

        {/* Category Breakdown Table for Category / Savings Report */}
        {(reportKind === 'category' || reportKind === 'savings') && categorySummary.length > 0 && (
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800">
              <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Category-wise Expense Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold text-[#64748B] dark:text-slate-400">
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Entries</th>
                    <th className="py-2.5 px-4 text-right">Share</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-sm">
                  {categorySummary.map((row) => (
                    <tr key={row.category}>
                      <td className="py-2.5 px-4 font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                        {row.category}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#64748B]">
                        {row.transactionCount}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#64748B]">
                        {row.sharePercent}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {formatCurrencyFromPaise(row.amountPaise, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ledger Preview Table */}
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              Statement Preview ({reportTransactions.length} rows)
            </h2>
            <span className="text-xs text-[#64748B] dark:text-slate-400">
              CSV columns: Date, Description, Category, Type, Amount
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[#64748B]">Loading report data...</div>
          ) : reportTransactions.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#64748B] dark:text-slate-400">
              No transactions match this report period and filter selection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold text-[#64748B] dark:text-slate-400">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800/80 text-sm">
                  {reportTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-2.5 px-4 whitespace-nowrap font-mono tabular-nums text-xs text-[#64748B] dark:text-slate-400">
                        {formatDisplayDate(tx.transactionDate)}
                      </td>
                      <td className="py-2.5 px-4 text-[#0F172A] dark:text-[#F8FAFC]">
                        {tx.description}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-[#64748B] dark:text-slate-300">
                        {tx.category}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {tx.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-4 whitespace-nowrap text-right font-mono tabular-nums font-semibold ${
                          tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {formatCurrencyFromPaise(tx.amountPaise, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
