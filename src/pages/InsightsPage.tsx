import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  PiggyBank,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { useFinanceData } from '../context/FinanceDataContext';
import { useToast } from '../context/ToastContext';
import { deleteInsight, generateAndSaveInsight } from '../services/aiService';
import type { AIInsightRecord, InsightType } from '../types/finance';
import {
  buildCategoryExpenseBreakdown,
  buildMonthlyTrend,
  calculatePercentDelta,
  calculateTotals,
  computeBudgetsWithUsage,
  computeThreeMonthExpenseForecast,
  filterTransactionsByMonthYear,
} from '../utils/calculations';
import {
  formatCurrencyFromPaise,
  formatDateTimeKolkata,
  getKolkataCurrentMonthYear,
  getMonthLabel,
  getPreviousMonthYear,
} from '../utils/formatters';

export function InsightsPage() {
  const { user, profile } = useAuth();
  const { transactions, budgets, insights, loading } = useFinanceData();
  const { showSuccess, showError } = useToast();

  const currentMY = getKolkataCurrentMonthYear();
  const [selectedYear, setSelectedYear] = useState(currentMY.year);
  const [selectedMonth, setSelectedMonth] = useState(currentMY.month);
  const [insightType, setInsightType] = useState<InsightType>('monthly_comprehensive');
  const [generating, setGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deletingInsight, setDeletingInsight] = useState<AIInsightRecord | null>(null);
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

  const monthTransactions = useMemo(
    () => filterTransactionsByMonthYear(transactions, selectedYear, selectedMonth),
    [transactions, selectedYear, selectedMonth],
  );

  const prevMY = getPreviousMonthYear(selectedYear, selectedMonth);
  const prevTransactions = useMemo(
    () => filterTransactionsByMonthYear(transactions, prevMY.year, prevMY.month),
    [transactions, prevMY.year, prevMY.month],
  );

  const monthTotals = useMemo(() => calculateTotals(monthTransactions), [monthTransactions]);
  const prevTotals = useMemo(() => calculateTotals(prevTransactions), [prevTransactions]);
  const categoryExpenses = useMemo(
    () => buildCategoryExpenseBreakdown(monthTransactions),
    [monthTransactions],
  );
  const budgetsWithUsage = useMemo(
    () => computeBudgetsWithUsage(budgets, transactions, selectedYear, selectedMonth),
    [budgets, transactions, selectedYear, selectedMonth],
  );
  const monthlyTrend = useMemo(
    () => buildMonthlyTrend(transactions, selectedYear, selectedMonth, 6),
    [transactions, selectedYear, selectedMonth],
  );
  const forecast = useMemo(
    () => computeThreeMonthExpenseForecast(transactions, selectedYear, selectedMonth),
    [transactions, selectedYear, selectedMonth],
  );

  const handleGenerate = async () => {
    if (!user) return;
    setApiError(null);

    if (monthTransactions.length === 0) {
      setApiError(
        `No transactions found for ${getMonthLabel(selectedYear, selectedMonth)}. Add transactions for this month before generating AI insights.`,
      );
      return;
    }

    setGenerating(true);
    try {
      const expenseChangePercent =
        prevTransactions.length > 0
          ? calculatePercentDelta(monthTotals.expensePaise, prevTotals.expensePaise)
          : null;

      await generateAndSaveInsight(user, {
        periodLabel: getMonthLabel(selectedYear, selectedMonth),
        currency,
        insightType,
        totalIncomeINR: Number((monthTotals.incomePaise / 100).toFixed(2)),
        totalExpensesINR: Number((monthTotals.expensePaise / 100).toFixed(2)),
        totalSavingsINR: Number((monthTotals.savingsPaise / 100).toFixed(2)),
        savingsRatePercent: monthTotals.savingsRatePercent,
        transactionCount: monthTransactions.length,
        previousMonth: {
          hasData: prevTransactions.length > 0,
          label: getMonthLabel(prevMY.year, prevMY.month),
          totalIncomeINR: Number((prevTotals.incomePaise / 100).toFixed(2)),
          totalExpensesINR: Number((prevTotals.expensePaise / 100).toFixed(2)),
          expenseChangePercent,
        },
        categoryExpenses: categoryExpenses.map((c) => ({
          category: c.category,
          amountINR: Number((c.amountPaise / 100).toFixed(2)),
          sharePercent: c.sharePercent,
        })),
        budgets: budgetsWithUsage.map((b) => ({
          category: b.category,
          limitINR: Number((b.monthlyLimitPaise / 100).toFixed(2)),
          spentINR: Number((b.spentPaise / 100).toFixed(2)),
          utilizationPercent: b.utilizationPercent,
        })),
        monthlyTrend: monthlyTrend.map((m) => ({
          monthLabel: m.label,
          incomeINR: Number((m.incomePaise / 100).toFixed(2)),
          expensesINR: Number((m.expensePaise / 100).toFixed(2)),
        })),
        forecast: {
          hasEnoughHistory: forecast.hasEnoughData,
          averageMonthlyExpenseINR:
            forecast.estimatedNextMonthPaise !== null
              ? Number((forecast.estimatedNextMonthPaise / 100).toFixed(2))
              : null,
          monthsUsed: forecast.monthsAvailable,
        },
      });

      showSuccess('AI financial insights generated and saved.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate AI insights.';
      setApiError(msg);
      showError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteInsight = async () => {
    if (!user || !deletingInsight) return;
    setDeleting(true);
    try {
      await deleteInsight(user.uid, deletingInsight.id);
      showSuccess('Insight entry deleted.');
      setDeletingInsight(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to delete insight.');
    } finally {
      setDeleting(false);
    }
  };

  const latest = insights[0] ?? null;
  const previousHistory = insights.slice(1);

  return (
    <AppShell
      title="AI Financial Insights"
      subtitle="Server-side Gemini analysis grounded strictly in your verified Firestore summaries"
    >
      <div className="space-y-6">
        {/* Generator Controls Card */}
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-[#6366F1]" />
                <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Generate Personalized Financial Analysis
                </h2>
              </div>
              <p className="text-sm text-[#64748B] dark:text-slate-400">
                All math is computed in BudStack AI before sending summarized totals to Gemini on
                the server. Only your selected period&apos;s aggregate metrics are analyzed.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor="ai-month-select"
                  className="block text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1"
                >
                  Target Month
                </label>
                <select
                  id="ai-month-select"
                  value={`${selectedYear}-${selectedMonth}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-').map(Number);
                    setSelectedYear(y);
                    setSelectedMonth(m);
                    setApiError(null);
                  }}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#0F172A] dark:text-[#F8FAFC]"
                >
                  {monthOptions.map((opt) => (
                    <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="ai-focus-select"
                  className="block text-xs font-medium text-[#64748B] dark:text-slate-400 mb-1"
                >
                  Analysis Focus
                </label>
                <select
                  id="ai-focus-select"
                  value={insightType}
                  onChange={(e) => setInsightType(e.target.value as InsightType)}
                  className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 px-3 py-2 text-sm text-[#0F172A] dark:text-[#F8FAFC]"
                >
                  <option value="monthly_comprehensive">Full Monthly Summary</option>
                  <option value="spending_alert">Spending &amp; Anomaly Review</option>
                  <option value="budget_review">Budget &amp; Savings Review</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Analyzing Finances...' : 'Generate Insights'}
              </button>
            </div>
          </div>

          {/* Data Snapshot Strip */}
          <div className="mt-5 pt-5 border-t border-[#E2E8F0] dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#64748B] dark:text-slate-400">Transactions in Period</span>
              <p className="mt-1 font-mono tabular-nums font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {monthTransactions.length}
              </p>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-slate-400">Income</span>
              <p className="mt-1 font-mono tabular-nums font-semibold text-[#16A34A]">
                {formatCurrencyFromPaise(monthTotals.incomePaise, currency)}
              </p>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-slate-400">Expenses</span>
              <p className="mt-1 font-mono tabular-nums font-semibold text-[#DC2626]">
                {formatCurrencyFromPaise(monthTotals.expensePaise, currency)}
              </p>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-slate-400">Active Budgets</span>
              <p className="mt-1 font-mono tabular-nums font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {budgetsWithUsage.length}
              </p>
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        {generating && (
          <div className="rounded-xl border border-[#6366F1]/30 bg-white dark:bg-[#111827] p-8 text-center space-y-3">
            <div className="mx-auto h-9 w-9 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC]">
              Reviewing your {getMonthLabel(selectedYear, selectedMonth)} financial summary...
            </p>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Checking category shares, previous month deltas, and budget utilization.
            </p>
          </div>
        )}

        {/* API Error with Retry */}
        {apiError && !generating && (
          <div
            role="alert"
            className="rounded-xl border border-[#DC2626]/30 bg-white dark:bg-[#111827] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Could not generate AI insights
                </p>
                <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">{apiError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap self-start sm:self-auto"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {/* Latest Insight Card */}
        {!generating && latest ? (
          <div className="space-y-6">
            {/* Monthly Summary Card */}
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Monthly Financial Summary — {latest.period}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    Generated {formatDateTimeKolkata(latest.generatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingInsight(latest)}
                  aria-label="Delete latest insight"
                  className="rounded-md p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-4 text-sm sm:text-base text-[#0F172A] dark:text-slate-200 leading-relaxed">
                {latest.summary}
              </p>
            </div>

            {/* 4-Panel Insights Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                  <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Spending Observations (Facts)
                  </h4>
                </div>
                <ul className="space-y-2.5 text-sm text-[#64748B] dark:text-slate-300">
                  {latest.observations.map((obs, idx) => (
                    <li key={idx} className="leading-relaxed">
                      • {obs}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-4 w-4 text-[#F59E0B]" />
                  <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Unusual Spending Detection
                  </h4>
                </div>
                <ul className="space-y-2.5 text-sm text-[#64748B] dark:text-slate-300">
                  {latest.unusualSpending.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-[#16A34A]" />
                  <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Savings Suggestions (Optional Ideas)
                  </h4>
                </div>
                <ul className="space-y-2.5 text-sm text-[#64748B] dark:text-slate-300">
                  {latest.savingsSuggestions.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <PiggyBank className="h-4 w-4 text-[#6366F1]" />
                  <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Suggested Budget Adjustments
                  </h4>
                </div>
                <ul className="space-y-2.5 text-sm text-[#64748B] dark:text-slate-300">
                  {latest.budgetRecommendations.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Disclaimer: {latest.disclaimer}
            </p>
          </div>
        ) : (
          !generating && (
            <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
              <BrainCircuit className="h-8 w-8 text-[#6366F1] mx-auto" />
              <h3 className="mt-3 text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                No AI insights generated yet
              </h3>
              <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
                Select a month with recorded transactions above and click &quot;Generate
                Insights&quot; to receive a structured financial breakdown.
              </p>
            </div>
          )
        )}

        {/* Previous Insights History */}
        {previousHistory.length > 0 && (
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
            <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-4">
              Previous Insights History
            </h3>
            <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
              {previousHistory.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                      <span className="font-semibold text-[#0F172A] dark:text-slate-200">
                        {item.period}
                      </span>
                      <span>·</span>
                      <span>{formatDateTimeKolkata(item.generatedAt)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeletingInsight(item)}
                      aria-label="Delete insight history item"
                      className="p-1 text-[#64748B] hover:text-[#DC2626]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deletingInsight)}
        title="Delete AI insight record?"
        description="This removes the saved insight summary from your Firestore history. Your transactions and budgets are unaffected."
        confirmLabel="Delete Insight"
        loading={deleting}
        onConfirm={handleDeleteInsight}
        onCancel={() => setDeletingInsight(null)}
      />
    </AppShell>
  );
}
