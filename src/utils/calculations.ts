import type {
  AnalyticsDatePreset,
  Budget,
  BudgetWithUsage,
  CategoryBreakdownItem,
  ExpenseForecastResult,
  MonthlyAggregate,
  Transaction,
} from '../types/finance';
import {
  getKolkataCurrentMonthYear,
  getKolkataTodayISO,
  getMonthLabel,
  getNextMonthYear,
  getPreviousMonthYear,
  shiftISOByDays,
} from './formatters';

export interface FinancialTotals {
  incomePaise: number;
  expensePaise: number;
  savingsPaise: number;
  balancePaise: number;
  savingsRatePercent: number | null;
}

export function calculateTotals(transactions: Transaction[]): FinancialTotals {
  let incomePaise = 0;
  let expensePaise = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      incomePaise += tx.amountPaise;
    } else if (tx.type === 'expense') {
      expensePaise += tx.amountPaise;
    }
  }

  const savingsPaise = incomePaise - expensePaise;
  const savingsRatePercent =
    incomePaise > 0 ? Number(((savingsPaise / incomePaise) * 100).toFixed(1)) : null;

  return {
    incomePaise,
    expensePaise,
    savingsPaise,
    balancePaise: savingsPaise,
    savingsRatePercent,
  };
}

export function calculatePercentDelta(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

export function filterTransactionsByMonthYear(
  transactions: Transaction[],
  year: number,
  month: number,
): Transaction[] {
  return transactions.filter((tx) => tx.year === year && tx.month === month);
}

export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
): Transaction[] {
  return transactions.filter(
    (tx) => tx.transactionDate >= startDate && tx.transactionDate <= endDate,
  );
}

export function resolvePresetDateRange(
  preset: AnalyticsDatePreset,
  customStart?: string,
  customEnd?: string,
): { startDate: string; endDate: string; label: string } {
  const today = getKolkataTodayISO();
  const { month, year } = getKolkataCurrentMonthYear();

  switch (preset) {
    case 'last_7_days':
      return {
        startDate: shiftISOByDays(today, -6),
        endDate: today,
        label: 'Last 7 Days',
      };
    case 'last_30_days':
      return {
        startDate: shiftISOByDays(today, -29),
        endDate: today,
        label: 'Last 30 Days',
      };
    case 'current_month': {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        startDate: start,
        endDate: end,
        label: getMonthLabel(year, month),
      };
    }
    case 'previous_month': {
      const prev = getPreviousMonthYear(year, month);
      const start = `${prev.year}-${String(prev.month).padStart(2, '0')}-01`;
      const lastDay = new Date(Date.UTC(prev.year, prev.month, 0)).getUTCDate();
      const end = `${prev.year}-${String(prev.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        startDate: start,
        endDate: end,
        label: getMonthLabel(prev.year, prev.month),
      };
    }
    case 'last_6_months': {
      let m = month;
      let y = year;
      for (let i = 0; i < 5; i++) {
        const prev = getPreviousMonthYear(y, m);
        y = prev.year;
        m = prev.month;
      }
      return {
        startDate: `${y}-${String(m).padStart(2, '0')}-01`,
        endDate: today,
        label: 'Last 6 Months',
      };
    }
    case 'last_12_months': {
      let m = month;
      let y = year;
      for (let i = 0; i < 11; i++) {
        const prev = getPreviousMonthYear(y, m);
        y = prev.year;
        m = prev.month;
      }
      return {
        startDate: `${y}-${String(m).padStart(2, '0')}-01`,
        endDate: today,
        label: 'Last 12 Months',
      };
    }
    case 'custom':
    default: {
      const start =
        customStart && /^\d{4}-\d{2}-\d{2}$/.test(customStart)
          ? customStart
          : shiftISOByDays(today, -29);
      const end = customEnd && /^\d{4}-\d{2}-\d{2}$/.test(customEnd) ? customEnd : today;
      return {
        startDate: start <= end ? start : end,
        endDate: end >= start ? end : start,
        label: `${start} to ${end}`,
      };
    }
  }
}

export function buildCategoryExpenseBreakdown(transactions: Transaction[]): CategoryBreakdownItem[] {
  const expenses = transactions.filter((tx) => tx.type === 'expense');
  let totalExpensePaise = 0;
  const map = new Map<string, { amountPaise: number; count: number }>();

  for (const tx of expenses) {
    totalExpensePaise += tx.amountPaise;
    const prev = map.get(tx.category) ?? { amountPaise: 0, count: 0 };
    map.set(tx.category, {
      amountPaise: prev.amountPaise + tx.amountPaise,
      count: prev.count + 1,
    });
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      amountPaise: data.amountPaise,
      sharePercent:
        totalExpensePaise > 0
          ? Number(((data.amountPaise / totalExpensePaise) * 100).toFixed(1))
          : 0,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise);
}

export function buildMonthlyTrend(
  transactions: Transaction[],
  endYear: number,
  endMonth: number,
  numMonths = 6,
): MonthlyAggregate[] {
  const buckets: Array<{ year: number; month: number; key: string }> = [];
  let y = endYear;
  let m = endMonth;

  for (let i = 0; i < numMonths; i++) {
    buckets.unshift({
      year: y,
      month: m,
      key: `${y}-${String(m).padStart(2, '0')}`,
    });
    const prev = getPreviousMonthYear(y, m);
    y = prev.year;
    m = prev.month;
  }

  const map = new Map<string, { incomePaise: number; expensePaise: number }>();
  for (const b of buckets) {
    map.set(b.key, { incomePaise: 0, expensePaise: 0 });
  }

  for (const tx of transactions) {
    const key = `${tx.year}-${String(tx.month).padStart(2, '0')}`;
    const entry = map.get(key);
    if (!entry) continue;
    if (tx.type === 'income') entry.incomePaise += tx.amountPaise;
    else if (tx.type === 'expense') entry.expensePaise += tx.amountPaise;
  }

  return buckets.map((b) => {
    const entry = map.get(b.key) ?? { incomePaise: 0, expensePaise: 0 };
    return {
      key: b.key,
      year: b.year,
      month: b.month,
      label: getMonthLabel(b.year, b.month, true),
      incomePaise: entry.incomePaise,
      expensePaise: entry.expensePaise,
      savingsPaise: entry.incomePaise - entry.expensePaise,
    };
  });
}

export function buildDailySpendingSeries(
  transactions: Transaction[],
): Array<{ date: string; label: string; expensePaise: number; incomePaise: number }> {
  const map = new Map<string, { expensePaise: number; incomePaise: number }>();
  for (const tx of transactions) {
    const prev = map.get(tx.transactionDate) ?? { expensePaise: 0, incomePaise: 0 };
    if (tx.type === 'expense') prev.expensePaise += tx.amountPaise;
    else prev.incomePaise += tx.amountPaise;
    map.set(tx.transactionDate, prev);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      label: date.slice(5),
      expensePaise: vals.expensePaise,
      incomePaise: vals.incomePaise,
    }));
}

export function computeBudgetsWithUsage(
  budgets: Budget[],
  transactions: Transaction[],
  year: number,
  month: number,
): BudgetWithUsage[] {
  const monthBudgets = budgets.filter((b) => b.year === year && b.month === month);
  const monthExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && tx.year === year && tx.month === month,
  );

  const spentByCategory = new Map<string, number>();
  for (const tx of monthExpenses) {
    spentByCategory.set(tx.category, (spentByCategory.get(tx.category) ?? 0) + tx.amountPaise);
  }

  return monthBudgets
    .map((budget) => {
      const spentPaise = spentByCategory.get(budget.category) ?? 0;
      const remainingPaise = budget.monthlyLimitPaise - spentPaise;
      const utilizationPercent =
        budget.monthlyLimitPaise > 0
          ? Number(((spentPaise / budget.monthlyLimitPaise) * 100).toFixed(1))
          : 0;

      let status: BudgetWithUsage['status'] = 'safe';
      if (utilizationPercent > 100) status = 'exceeded';
      else if (utilizationPercent >= 90) status = 'critical';
      else if (utilizationPercent >= 75) status = 'warning';

      return {
        ...budget,
        spentPaise,
        remainingPaise,
        utilizationPercent,
        status,
      };
    })
    .sort((a, b) => b.utilizationPercent - a.utilizationPercent);
}

export function computeThreeMonthExpenseForecast(
  transactions: Transaction[],
  referenceYear?: number,
  referenceMonth?: number,
): ExpenseForecastResult {
  const current =
    referenceYear && referenceMonth
      ? { year: referenceYear, month: referenceMonth }
      : getKolkataCurrentMonthYear();

  const nextMonth = getNextMonthYear(current.year, current.month);
  const nextMonthLabel = getMonthLabel(nextMonth.year, nextMonth.month);

  const completeTargetMonths: Array<{ year: number; month: number; key: string; label: string }> = [];
  let cursor = getPreviousMonthYear(current.year, current.month);
  for (let i = 0; i < 3; i++) {
    completeTargetMonths.unshift({
      year: cursor.year,
      month: cursor.month,
      key: `${cursor.year}-${String(cursor.month).padStart(2, '0')}`,
      label: getMonthLabel(cursor.year, cursor.month, true),
    });
    cursor = getPreviousMonthYear(cursor.year, cursor.month);
  }

  const expenseByMonth = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const key = `${tx.year}-${String(tx.month).padStart(2, '0')}`;
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + tx.amountPaise);
  }

  const historicalMonths = completeTargetMonths.map((m) => ({
    key: m.key,
    label: m.label,
    expensePaise: expenseByMonth.get(m.key) ?? 0,
  }));

  const monthsWithExpenses = historicalMonths.filter((m) => m.expensePaise > 0);
  const hasEnoughData = monthsWithExpenses.length >= 3;

  const estimatedNextMonthPaise = hasEnoughData
    ? Math.round(
        historicalMonths.reduce((sum, item) => sum + item.expensePaise, 0) /
          historicalMonths.length,
      )
    : null;

  return {
    hasEnoughData,
    monthsAvailable: monthsWithExpenses.length,
    monthsRequired: 3,
    historicalMonths,
    estimatedNextMonthPaise,
    nextMonthLabel,
    methodDescription:
      'Simple arithmetic mean of total recorded expenses across the previous 3 complete calendar months.',
  };
}
