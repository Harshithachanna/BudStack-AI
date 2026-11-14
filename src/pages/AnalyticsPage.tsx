import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  ExpenseDistributionChart,
  ForecastComparisonChart,
  IncomeVsExpensesChart,
  SavingsTrendChart,
  SpendingTrendChart,
} from '../components/charts/FinanceCharts';
import { DashboardSkeleton } from '../components/common/Skeletons';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { useFinanceData } from '../context/FinanceDataContext';
import type { AnalyticsDatePreset } from '../types/finance';
import {
  buildCategoryExpenseBreakdown,
  buildDailySpendingSeries,
  buildMonthlyTrend,
  calculatePercentDelta,
  calculateTotals,
  computeBudgetsWithUsage,
  computeThreeMonthExpenseForecast,
  filterTransactionsByDateRange,
  filterTransactionsByMonthYear,
  resolvePresetDateRange,
} from '../utils/calculations';
import {
  formatCurrencyFromPaise,
  getKolkataCurrentMonthYear,
  getKolkataTodayISO,
  getMonthLabel,
  getPreviousMonthYear,
  shiftISOByDays,
} from '../utils/formatters';

const PRESETS: Array<{ id: AnalyticsDatePreset; label: string }> = [
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'current_month', label: 'Current Month' },
  { id: 'previous_month', label: 'Previous Month' },
  { id: 'last_6_months', label: 'Last 6 Months' },
  { id: 'last_12_months', label: 'Last 12 Months' },
  { id: 'custom', label: 'Custom Range' },
];

export function AnalyticsPage() {
  const { profile } = useAuth();
  const { transactions, budgets, loading } = useFinanceData();
  const currency = profile?.preferredCurrency ?? 'INR';

  const today = getKolkataTodayISO();
  const currentMY = getKolkataCurrentMonthYear();
  const prevMY = getPreviousMonthYear(currentMY.year, currentMY.month);

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last_30_days');
  const [customStart, setCustomStart] = useState(shiftISOByDays(today, -29));
  const [customEnd, setCustomEnd] = useState(today);

  const range = useMemo(
    () => resolvePresetDateRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );

  const filteredTx = useMemo(
    () => filterTransactionsByDateRange(transactions, range.startDate, range.endDate),
    [transactions, range.startDate, range.endDate],
  );

  const totals = useMemo(() => calculateTotals(filteredTx), [filteredTx]);
  const categoryBreakdown = useMemo(
    () => buildCategoryExpenseBreakdown(filteredTx),
    [filteredTx],
  );

  const highestCategory = categoryBreakdown[0] ?? null;
  const lowestCategory =
    categoryBreakdown.length > 0 ? categoryBreakdown[categoryBreakdown.length - 1] : null;

  const monthlyTrend = useMemo(
    () =>
      buildMonthlyTrend(
        transactions,
        currentMY.year,
        currentMY.month,
        preset === 'last_12_months' ? 12 : 6,
      ),
    [transactions, currentMY.year, currentMY.month, preset],
  );

  const dailySeries = useMemo(() => buildDailySpendingSeries(filteredTx), [filteredTx]);

  // Month-over-month comparison (current vs previous calendar month)
  const currentMonthTotals = useMemo(
    () =>
      calculateTotals(
        filterTransactionsByMonthYear(transactions, currentMY.year, currentMY.month),
      ),
    [transactions, currentMY.year, currentMY.month],
  );

  const prevMonthTx = useMemo(
    () => filterTransactionsByMonthYear(transactions, prevMY.year, prevMY.month),
    [transactions, prevMY.year, prevMY.month],
  );
  const prevMonthTotals = useMemo(() => calculateTotals(prevMonthTx), [prevMonthTx]);

  const momExpenseDelta =
    prevMonthTx.length > 0
      ? calculatePercentDelta(currentMonthTotals.expensePaise, prevMonthTotals.expensePaise)
      : null;

  const momIncomeDelta =
    prevMonthTx.length > 0
      ? calculatePercentDelta(currentMonthTotals.incomePaise, prevMonthTotals.incomePaise)
      : null;

  // Budget utilization for current month
  const currentBudgets = useMemo(
    () => computeBudgetsWithUsage(budgets, transactions, currentMY.year, currentMY.month),
    [budgets, transactions, currentMY.year, currentMY.month],
  );

  const overallBudgetUtilization = useMemo(() => {
    const limitSum = currentBudgets.reduce((s, b) => s + b.monthlyLimitPaise, 0);
    const spentSum = currentBudgets.reduce((s, b) => s + b.spentPaise, 0);
    if (limitSum <= 0) return null;
    return Number(((spentSum / limitSum) * 100).toFixed(1));
  }, [currentBudgets]);

  // Transparent 3-Month Statistical Expense Forecast
  const forecast = useMemo(
    () => computeThreeMonthExpenseForecast(transactions, currentMY.year, currentMY.month),
    [transactions, currentMY.year, currentMY.month],
  );

  return (
    <AppShell
      title="Financial Analytics & Forecasting"
      subtitle={`Deep-dive trends, category performance, and 3-month expense estimates (${range.label})`}
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    preset === p.id
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-100 dark:bg-slate-900 text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <Calendar className="h-4 w-4 text-[#64748B]" />
                <input
                  type="date"
                  aria-label="Custom start date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-1.5 text-[#0F172A] dark:text-[#F8FAFC]"
                />
                <span className="text-[#64748B]">to</span>
                <input
                  type="date"
                  aria-label="Custom end date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-1.5 text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>
            )}
          </div>

          {/* Analytics Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <p className="text-xs text-[#64748B] dark:text-slate-400">Period Income</p>
              <p className="mt-2 text-xl font-bold font-mono tabular-nums text-[#16A34A]">
                {formatCurrencyFromPaise(totals.incomePaise, currency)}
              </p>
              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">{range.label}</p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <p className="text-xs text-[#64748B] dark:text-slate-400">Period Expenses</p>
              <p className="mt-2 text-xl font-bold font-mono tabular-nums text-[#DC2626]">
                {formatCurrencyFromPaise(totals.expensePaise, currency)}
              </p>
              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                {filteredTx.filter((t) => t.type === 'expense').length} expense entries
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <p className="text-xs text-[#64748B] dark:text-slate-400">Highest Spending Category</p>
              <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                {highestCategory ? highestCategory.category : '—'}
              </p>
              <p className="mt-1 text-xs font-mono tabular-nums text-[#64748B] dark:text-slate-400">
                {highestCategory
                  ? `${formatCurrencyFromPaise(highestCategory.amountPaise, currency)} (${highestCategory.sharePercent}%)`
                  : 'No expenses in range'}
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <p className="text-xs text-[#64748B] dark:text-slate-400">Lowest Spending Category</p>
              <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                {lowestCategory ? lowestCategory.category : '—'}
              </p>
              <p className="mt-1 text-xs font-mono tabular-nums text-[#64748B] dark:text-slate-400">
                {lowestCategory
                  ? `${formatCurrencyFromPaise(lowestCategory.amountPaise, currency)} (${lowestCategory.sharePercent}%)`
                  : 'No expenses in range'}
              </p>
            </div>
          </div>

          {/* Month-over-Month Comparison & Budget Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Month-over-Month Comparison
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                {getMonthLabel(currentMY.year, currentMY.month)} vs{' '}
                {getMonthLabel(prevMY.year, prevMY.month)}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 p-4">
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Income Change</p>
                  <p className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                    {formatCurrencyFromPaise(currentMonthTotals.incomePaise, currency)}
                  </p>
                  <p className="mt-1 text-xs flex items-center gap-1">
                    {momIncomeDelta !== null ? (
                      <span
                        className={`inline-flex items-center font-medium ${
                          momIncomeDelta >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {momIncomeDelta >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {momIncomeDelta >= 0 ? `+${momIncomeDelta}%` : `${momIncomeDelta}%`}
                      </span>
                    ) : (
                      <span className="text-[#64748B]">No prior month data</span>
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 p-4">
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Expense Change</p>
                  <p className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                    {formatCurrencyFromPaise(currentMonthTotals.expensePaise, currency)}
                  </p>
                  <p className="mt-1 text-xs flex items-center gap-1">
                    {momExpenseDelta !== null ? (
                      <span
                        className={`inline-flex items-center font-medium ${
                          momExpenseDelta <= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {momExpenseDelta > 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {momExpenseDelta >= 0 ? `+${momExpenseDelta}%` : `${momExpenseDelta}%`}
                      </span>
                    ) : (
                      <span className="text-[#64748B]">No prior month data</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Current Month Budget Utilization
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    {getMonthLabel(currentMY.year, currentMY.month)}
                  </p>
                </div>
                {overallBudgetUtilization !== null && (
                  <span className="text-lg font-bold font-mono tabular-nums text-[#2563EB]">
                    {overallBudgetUtilization}%
                  </span>
                )}
              </div>

              {currentBudgets.length === 0 ? (
                <p className="mt-6 text-sm text-[#64748B] dark:text-slate-400">
                  No budgets configured for the current month yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {currentBudgets.slice(0, 4).map((b) => (
                    <div key={b.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-[#0F172A] dark:text-slate-200">
                          {b.category}
                        </span>
                        <span className="font-mono tabular-nums text-[#64748B] dark:text-slate-400">
                          {b.utilizationPercent}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.utilizationPercent > 100
                              ? 'bg-[#DC2626]'
                              : b.utilizationPercent >= 75
                                ? 'bg-[#F59E0B]'
                                : 'bg-[#16A34A]'
                          }`}
                          style={{ width: `${Math.min(100, b.utilizationPercent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Core Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                Income vs Expenses ({preset === 'last_12_months' ? '12' : '6'} Months)
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mb-4">
                Monthly cash flow comparison
              </p>
              <IncomeVsExpensesChart data={monthlyTrend} currency={currency} />
            </div>

            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                Expense Analysis by Category (Pie Chart)
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mb-4">
                Proportional expense distribution for {range.label}
              </p>
              <ExpenseDistributionChart data={categoryBreakdown} currency={currency} />
            </div>

            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                Spending Velocity ({range.label})
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mb-4">
                Daily expenditure changes
              </p>
              <SpendingTrendChart data={dailySeries} currency={currency} />
            </div>

            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                Monthly Net Savings Trend
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mb-4">
                Surplus retained each month
              </p>
              <SavingsTrendChart data={monthlyTrend} currency={currency} />
            </div>
          </div>

          {/* Transparent Statistical Expense Forecasting Module */}
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0] dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#F59E0B]" />
                  <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Next-Month Expense Forecast (Statistical Average)
                  </h2>
                </div>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                  {forecast.methodDescription}
                </p>
              </div>
              <span className="text-xs font-medium text-[#F59E0B] whitespace-nowrap">
                Estimated Baseline · Not Actual Spending
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-4">
                {forecast.hasEnoughData && forecast.estimatedNextMonthPaise !== null ? (
                  <>
                    <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-4">
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
                        Estimated {forecast.nextMonthLabel} Expenses (3-Month Average)
                      </p>
                      <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                        Approx.{' '}
                        {formatCurrencyFromPaise(forecast.estimatedNextMonthPaise, currency, {
                          showDecimals: false,
                        })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
                        Historical Complete Months Included
                      </p>
                      {forecast.historicalMonths.map((m) => (
                        <div
                          key={m.key}
                          className="flex items-center justify-between text-sm py-1.5 border-b border-[#E2E8F0] dark:border-slate-800 last:border-b-0"
                        >
                          <span className="text-[#0F172A] dark:text-slate-200">{m.label}</span>
                          <span className="font-mono tabular-nums font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                            {formatCurrencyFromPaise(m.expensePaise, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      <Info className="h-4 w-4 text-[#2563EB]" />
                      <span>Insufficient Historical Data</span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                      A 3-month rolling average forecast requires recorded expenses across all 3
                      previous complete calendar months ({forecast.monthsAvailable} of{' '}
                      {forecast.monthsRequired} complete months currently have expenses).
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7">
                <ForecastComparisonChart forecast={forecast} currency={currency} />
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
