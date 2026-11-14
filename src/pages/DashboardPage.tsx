import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Database,
  Percent,
  PieChart as PieChartIcon,
  PiggyBank,
  PlusCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  CashFlowSplineChart,
  ExpenseDistributionChart,
  IncomeVsExpensesChart,
  SavingsTrendChart,
  SpendingTrendChart,
} from '../components/charts/FinanceCharts';
import { DashboardSkeleton } from '../components/common/Skeletons';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { useFinanceData } from '../context/FinanceDataContext';
import { useToast } from '../context/ToastContext';
import { loadSampleTransactions } from '../services/transactionService';
import {
  buildCategoryExpenseBreakdown,
  buildDailySpendingSeries,
  buildMonthlyTrend,
  calculatePercentDelta,
  calculateTotals,
  computeBudgetsWithUsage,
  filterTransactionsByDateRange,
  filterTransactionsByMonthYear,
} from '../utils/calculations';
import {
  formatCurrencyFromPaise,
  formatDisplayDate,
  getKolkataCurrentMonthYear,
  getMonthLabel,
  getPreviousMonthYear,
} from '../utils/formatters';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const { transactions, budgets, insights, loading, error, refreshData } = useFinanceData();
  const { showSuccess, showError } = useToast();

  const currentMY = getKolkataCurrentMonthYear();
  const [selectedYear, setSelectedYear] = useState(currentMY.year);
  const [selectedMonth, setSelectedMonth] = useState(currentMY.month);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [loadingSample, setLoadingSample] = useState(false);
  const [expenseChartVariant, setExpenseChartVariant] = useState<'donut' | 'pie'>('donut');

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

  const activeTransactions = useMemo(() => {
    if (startDateFilter && endDateFilter) {
      return filterTransactionsByDateRange(transactions, startDateFilter, endDateFilter);
    }
    return filterTransactionsByMonthYear(transactions, selectedYear, selectedMonth);
  }, [transactions, selectedYear, selectedMonth, startDateFilter, endDateFilter]);

  const prevMY = getPreviousMonthYear(selectedYear, selectedMonth);
  const previousMonthTransactions = useMemo(
    () => filterTransactionsByMonthYear(transactions, prevMY.year, prevMY.month),
    [transactions, prevMY.year, prevMY.month],
  );

  const allTimeTotals = useMemo(() => calculateTotals(transactions), [transactions]);
  const periodTotals = useMemo(() => calculateTotals(activeTransactions), [activeTransactions]);
  const prevTotals = useMemo(
    () => calculateTotals(previousMonthTransactions),
    [previousMonthTransactions],
  );

  const incomeDiffPaise = periodTotals.incomePaise - prevTotals.incomePaise;
  const expenseDiffPaise = periodTotals.expensePaise - prevTotals.expensePaise;

  const incomeDelta = useMemo(
    () =>
      previousMonthTransactions.length > 0
        ? calculatePercentDelta(periodTotals.incomePaise, prevTotals.incomePaise)
        : null,
    [previousMonthTransactions.length, periodTotals.incomePaise, prevTotals.incomePaise],
  );

  const expenseDelta = useMemo(
    () =>
      previousMonthTransactions.length > 0
        ? calculatePercentDelta(periodTotals.expensePaise, prevTotals.expensePaise)
        : null,
    [previousMonthTransactions.length, periodTotals.expensePaise, prevTotals.expensePaise],
  );

  const savingsDelta = useMemo(
    () =>
      previousMonthTransactions.length > 0
        ? calculatePercentDelta(periodTotals.savingsPaise, prevTotals.savingsPaise)
        : null,
    [previousMonthTransactions.length, periodTotals.savingsPaise, prevTotals.savingsPaise],
  );

  const monthlyTrend = useMemo(
    () => buildMonthlyTrend(transactions, selectedYear, selectedMonth, 6),
    [transactions, selectedYear, selectedMonth],
  );

  const categoryBreakdown = useMemo(
    () => buildCategoryExpenseBreakdown(activeTransactions),
    [activeTransactions],
  );

  const dailySpending = useMemo(
    () => buildDailySpendingSeries(activeTransactions),
    [activeTransactions],
  );

  const budgetsWithUsage = useMemo(
    () => computeBudgetsWithUsage(budgets, transactions, selectedYear, selectedMonth),
    [budgets, transactions, selectedYear, selectedMonth],
  );

  const recentTransactions = useMemo(() => activeTransactions.slice(0, 6), [activeTransactions]);
  const latestInsight = insights[0] ?? null;
  const topCategory = categoryBreakdown[0] ?? null;

  const handleLoadSample = async () => {
    if (!user) return;
    setLoadingSample(true);
    try {
      const count = await loadSampleTransactions(user.uid);
      showSuccess(`Loaded ${count} sample starter transactions across 4 months.`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to load sample data.');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedYear(currentMY.year);
    setSelectedMonth(currentMY.month);
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const selectedPeriodLabel =
    startDateFilter && endDateFilter
      ? `${startDateFilter} to ${endDateFilter}`
      : getMonthLabel(selectedYear, selectedMonth);

  return (
    <AppShell
      title={`Welcome back, ${(profile?.name || user?.displayName || 'there').split(' ')[0]}`}
      subtitle={`Your financial health at a glance for ${selectedPeriodLabel}`}
      actions={
        <button
          type="button"
          onClick={refreshData}
          aria-label="Refresh financial data"
          className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-[#DC2626]/30 bg-white dark:bg-[#111827] p-6">
          <h2 className="text-base font-semibold text-[#DC2626]">Failed to load dashboard data</h2>
          <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-400">{error}</p>
          <button
            type="button"
            onClick={refreshData}
            className="mt-4 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Period Filter Toolbar */}
          <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label htmlFor="dash-month-select" className="sr-only">
                  Select Month
                </label>
                <select
                  id="dash-month-select"
                  value={`${selectedYear}-${selectedMonth}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-').map(Number);
                    setSelectedYear(y);
                    setSelectedMonth(m);
                    setStartDateFilter('');
                    setEndDateFilter('');
                  }}
                  className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-none"
                >
                  {monthOptions.map((opt) => (
                    <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                <span>Custom range:</span>
                <input
                  type="date"
                  aria-label="Start date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-2.5 py-1.5 text-xs text-[#0F172A] dark:text-[#F8FAFC]"
                />
                <span>to</span>
                <input
                  type="date"
                  aria-label="End date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-2.5 py-1.5 text-xs text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>

              {(startDateFilter ||
                endDateFilter ||
                selectedYear !== currentMY.year ||
                selectedMonth !== currentMY.month) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  Reset to Current Month
                </button>
              )}
            </div>

            {transactions.length === 0 && (
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={loadingSample}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Database className="h-3.5 w-3.5 text-[#6366F1]" />
                {loadingSample ? 'Loading Sample Data...' : 'Load Sample Starter Data'}
              </button>
            )}
          </div>

          {/* Empty Account Onboarding Banner */}
          {transactions.length === 0 && (
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                No transactions yet. Add your first transaction to get started.
              </h2>
              <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400 max-w-lg mx-auto">
                Your BudStack AI ledger starts clean. Record an income or expense entry to unlock
                real-time charts, budget tracking, 3-month forecasting, and Gemini AI insights.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/transactions/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add First Transaction
                </Link>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  disabled={loadingSample}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Database className="h-4 w-4 text-[#6366F1]" />
                  {loadingSample ? 'Loading...' : 'Explore with Sample Data'}
                </button>
              </div>
            </div>
          )}

          {/* Top Bento Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            {/* Left 8 Columns: 3 KPI Cards + Savings Strip + Cash Flow Spline + AI Insight Card */}
            <div className="xl:col-span-8 flex flex-col gap-5">
              {/* 3 Primary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Balance */}
                <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-9 w-9 rounded-full bg-[#2563EB]/10 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Wallet className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Total Balance
                      </span>
                    </div>
                    <Link
                      to="/transactions"
                      className="text-xs font-medium text-[#64748B] hover:text-[#2563EB] transition-colors"
                    >
                      Ledger
                    </Link>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                      {formatCurrencyFromPaise(allTimeTotals.balancePaise, currency, {
                        showDecimals: false,
                      })}
                    </p>
                  </div>

                  <p className="mt-2.5 text-xs text-[#64748B] dark:text-slate-400">
                    All-time net balance across{' '}
                    <span className="font-semibold text-[#0F172A] dark:text-slate-200">
                      {transactions.length}
                    </span>{' '}
                    entries
                  </p>
                </div>

                {/* Monthly Income */}
                <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-9 w-9 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                        <ArrowDownLeft className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Monthly Income
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                      {formatCurrencyFromPaise(periodTotals.incomePaise, currency, {
                        showDecimals: false,
                      })}
                    </p>
                    {incomeDelta !== null && (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-semibold font-mono tabular-nums shrink-0 ${
                          incomeDelta >= 0
                            ? 'bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/40'
                            : 'bg-red-50 text-[#DC2626] dark:bg-red-950/40'
                        }`}
                      >
                        {incomeDelta >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 rotate-90" />
                        )}
                        {incomeDelta >= 0 ? `+${incomeDelta}%` : `${incomeDelta}%`}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs text-[#64748B] dark:text-slate-400">
                    {previousMonthTransactions.length > 0 ? (
                      <>
                        {incomeDiffPaise >= 0 ? 'Increased ' : 'Decreased '}
                        <span
                          className={`font-semibold font-mono tabular-nums ${
                            incomeDiffPaise >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {incomeDiffPaise >= 0 ? '+' : '-'}
                          {formatCurrencyFromPaise(Math.abs(incomeDiffPaise), currency, {
                            showDecimals: false,
                          })}
                        </span>{' '}
                        from last month
                      </>
                    ) : (
                      'No prior month baseline'
                    )}
                  </p>
                </div>

                {/* Monthly Expense */}
                <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-9 w-9 rounded-full bg-[#DC2626]/10 text-[#DC2626] dark:bg-red-950/60 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Monthly Expense
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                      {formatCurrencyFromPaise(periodTotals.expensePaise, currency, {
                        showDecimals: false,
                      })}
                    </p>
                    {expenseDelta !== null && (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-semibold font-mono tabular-nums shrink-0 ${
                          expenseDelta <= 0
                            ? 'bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/40'
                            : 'bg-red-50 text-[#DC2626] dark:bg-red-950/40'
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {expenseDelta >= 0 ? `+${expenseDelta}%` : `${expenseDelta}%`}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs text-[#64748B] dark:text-slate-400">
                    {previousMonthTransactions.length > 0 ? (
                      <>
                        {expenseDiffPaise >= 0 ? 'Increased ' : 'Decreased '}
                        <span
                          className={`font-semibold font-mono tabular-nums ${
                            expenseDiffPaise <= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {expenseDiffPaise >= 0 ? '+' : '-'}
                          {formatCurrencyFromPaise(Math.abs(expenseDiffPaise), currency, {
                            showDecimals: false,
                          })}
                        </span>{' '}
                        from last month
                      </>
                    ) : (
                      'No prior month baseline'
                    )}
                  </p>
                </div>
              </div>

              {/* Net Savings & Savings Rate Summary Strip */}
              <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] px-5 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-[#6366F1]/10 dark:bg-indigo-950/60 text-[#6366F1] dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <PiggyBank className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                        Total Savings ({selectedPeriodLabel})
                      </p>
                      <p
                        className={`text-base font-bold font-mono tabular-nums ${
                          periodTotals.savingsPaise >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {formatCurrencyFromPaise(periodTotals.savingsPaise, currency)}
                      </p>
                    </div>
                  </div>
                  {savingsDelta !== null && (
                    <span
                      className={`text-xs font-semibold font-mono tabular-nums ${
                        savingsDelta >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                      }`}
                    >
                      {savingsDelta >= 0 ? `+${savingsDelta}%` : `${savingsDelta}%`} vs prev
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 sm:border-l sm:border-[#E2E8F0] dark:sm:border-slate-800 sm:pl-4">
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full bg-[#2563EB]/10 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Percent className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                        Savings Rate
                      </p>
                      <p className="text-base font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                        {periodTotals.savingsRatePercent !== null
                          ? `${periodTotals.savingsRatePercent}%`
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#64748B] dark:text-slate-400">
                    {periodTotals.savingsRatePercent !== null
                      ? periodTotals.savingsRatePercent >= 20
                        ? 'Healthy (>20% target)'
                        : 'Below 20% target'
                      : 'Log income to calculate'}
                  </span>
                </div>
              </div>

              {/* Row 2: Monthly Cash Flow Spline + Brand Accent AI Insight Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
                <div className="lg:col-span-7 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Monthly Cash Flow
                      </h2>
                      <p className="text-xs text-[#64748B] dark:text-slate-400">
                        6-month Income vs Expenses ending{' '}
                        {getMonthLabel(selectedYear, selectedMonth, true)}
                      </p>
                    </div>
                    <Link
                      to="/analytics"
                      className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors whitespace-nowrap"
                    >
                      Deep Analytics
                    </Link>
                  </div>
                  <CashFlowSplineChart data={monthlyTrend} currency={currency} />
                </div>

                {/* Brand Blue-to-Indigo AI Insight Card */}
                <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] p-5 text-white shadow-md shadow-indigo-500/15 flex flex-col justify-between relative overflow-hidden">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 200 160"
                    className="pointer-events-none absolute -bottom-6 -left-6 h-40 w-48 opacity-15"
                  >
                    <polygon points="0,160 85,40 160,160" fill="#FFFFFF" />
                    <polygon points="40,160 120,65 200,160" fill="#C7D2FE" />
                  </svg>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-9 w-9 rounded-full bg-white text-[#6366F1] flex items-center justify-center shrink-0 shadow-xs">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <h2 className="text-base font-semibold text-white">AI Insight</h2>
                      </div>
                      <Link
                        to="/insights"
                        aria-label="Open AI Insights"
                        className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                      >
                        <ArrowRight className="h-4 w-4 text-white" />
                      </Link>
                    </div>

                    {latestInsight ? (
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-100">
                          Period: {latestInsight.period}
                        </p>
                        <p className="text-sm font-medium leading-relaxed text-white/95 line-clamp-5">
                          {latestInsight.summary}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm font-medium leading-relaxed text-white/95">
                        Unlock personalized Gemini AI observations on your spending habits, top
                        cost drivers, and realistic monthly savings targets.
                      </p>
                    )}
                  </div>

                  <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to="/insights"
                      className="text-xs font-medium text-indigo-50 hover:text-white underline-offset-4 hover:underline"
                    >
                      {latestInsight ? 'Full Analysis' : 'Generate Insight'}
                    </Link>
                    <Link
                      to="/budgets"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors shadow-xs whitespace-nowrap"
                    >
                      <span>Set Budget</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Tall Expense Breakdown Card */}
            <div className="xl:col-span-4 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-9 w-9 rounded-full bg-[#6366F1]/10 text-[#6366F1] dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <PieChartIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Expense Breakdown
                      </h2>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                        {selectedPeriodLabel}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setExpenseChartVariant('donut')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        expenseChartVariant === 'donut'
                          ? 'bg-white dark:bg-slate-800 text-[#2563EB] shadow-xs'
                          : 'text-[#64748B] dark:text-slate-400'
                      }`}
                    >
                      Ring
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseChartVariant('pie')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        expenseChartVariant === 'pie'
                          ? 'bg-white dark:bg-slate-800 text-[#2563EB] shadow-xs'
                          : 'text-[#64748B] dark:text-slate-400'
                      }`}
                    >
                      Pie
                    </button>
                  </div>
                </div>

                <ExpenseDistributionChart
                  data={categoryBreakdown}
                  currency={currency}
                  variant={expenseChartVariant}
                  layout="stacked"
                />
              </div>

              <div className="mt-5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900/90 border border-[#E2E8F0] dark:border-slate-800 p-3.5 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-[#6366F1] dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-[#334155] dark:text-slate-300">
                  {topCategory ? (
                    <>
                      <span className="font-semibold text-[#0F172A] dark:text-white">
                        {topCategory.category}
                      </span>{' '}
                      accounts for{' '}
                      <span className="font-mono font-semibold text-[#2563EB] dark:text-blue-400">
                        {topCategory.sharePercent}%
                      </span>{' '}
                      (
                      {formatCurrencyFromPaise(topCategory.amountPaise, currency, {
                        showDecimals: false,
                      })}
                      ) of your recorded spending across {categoryBreakdown.length} categories.
                    </>
                  ) : (
                    'Log expense entries in this period to reveal your category concentration and spending share.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Row: Budget Overview & Latest Transactions Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Budget Overview */}
            <div className="lg:col-span-5 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-9 w-9 rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                    <PiggyBank className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      Budget Overview
                    </h2>
                    <p className="text-xs text-[#64748B] dark:text-slate-400">
                      {getMonthLabel(selectedYear, selectedMonth)} limits
                    </p>
                  </div>
                </div>
                <Link
                  to="/budgets"
                  className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
                >
                  Manage Budgets
                </Link>
              </div>

              {budgetsWithUsage.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-[#64748B] dark:text-slate-400">
                    No monthly budgets set for {getMonthLabel(selectedYear, selectedMonth)}.
                  </p>
                  <Link
                    to="/budgets"
                    className="mt-2 inline-block text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    Create your first category budget
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgetsWithUsage.slice(0, 5).map((b) => {
                    const barColor =
                      b.status === 'exceeded'
                        ? 'bg-[#DC2626]'
                        : b.status === 'critical' || b.status === 'warning'
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#16A34A]';

                    return (
                      <div key={b.id}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-[#0F172A] dark:text-slate-200">
                            {b.category}
                          </span>
                          <span className="font-mono tabular-nums text-[#64748B] dark:text-slate-400">
                            {formatCurrencyFromPaise(b.spentPaise, currency, {
                              showDecimals: false,
                            })}{' '}
                            /{' '}
                            {formatCurrencyFromPaise(b.monthlyLimitPaise, currency, {
                              showDecimals: false,
                            })}{' '}
                            ({b.utilizationPercent}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${Math.min(100, b.utilizationPercent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Latest Transactions Table */}
            <div className="lg:col-span-7 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Latest Transactions
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">
                    Recent activity in {selectedPeriodLabel}
                  </p>
                </div>
                <Link
                  to="/transactions"
                  className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
                >
                  View All
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-[#64748B] dark:text-slate-400">
                    No transactions recorded for {selectedPeriodLabel}.
                  </p>
                  <Link
                    to="/transactions/new"
                    className="mt-3 inline-block text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    Record a transaction
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[#F8FAFC] dark:bg-slate-900/80 text-xs font-medium text-[#64748B] dark:text-slate-400">
                        <th className="py-2.5 px-3 rounded-l-lg">Description</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 rounded-r-lg text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                      {recentTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  tx.type === 'income'
                                    ? 'bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/40'
                                    : 'bg-red-50 text-[#DC2626] dark:bg-red-950/40 dark:text-red-400'
                                }`}
                              >
                                {tx.type === 'income' ? (
                                  <ArrowDownLeft className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-[190px] sm:max-w-[240px]">
                                  {tx.description}
                                </p>
                                {tx.isSample && (
                                  <span className="text-[10px] font-semibold text-[#F59E0B]">
                                    Sample
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td
                            className={`py-3 px-3 font-mono tabular-nums font-semibold whitespace-nowrap ${
                              tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrencyFromPaise(tx.amountPaise, currency)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex rounded-md border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-2 py-0.5 text-xs font-medium text-[#475569] dark:text-slate-300">
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-xs text-[#64748B] dark:text-slate-400 whitespace-nowrap">
                            {formatDisplayDate(tx.transactionDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Income vs Expenses
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  6-month volume comparison
                </p>
              </div>
              <IncomeVsExpensesChart data={monthlyTrend} currency={currency} />
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Spending Velocity
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Daily expenditure for {selectedPeriodLabel}
                </p>
              </div>
              <SpendingTrendChart data={dailySpending} currency={currency} />
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Savings Trajectory
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Net monthly savings over 6 months
                </p>
              </div>
              <SavingsTrendChart data={monthlyTrend} currency={currency} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

