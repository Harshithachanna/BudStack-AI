import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import type {
  CategoryBreakdownItem,
  CurrencyCode,
  ExpenseForecastResult,
  MonthlyAggregate,
} from '../../types/finance';
import { formatCurrencyFromPaise } from '../../utils/formatters';

export const CATEGORY_COLORS = [
  '#2563EB', // Primary Blue
  '#6366F1', // Secondary Indigo
  '#16A34A', // Success Green
  '#F59E0B', // Warning Amber
  '#0EA5E9', // Sky Blue
  '#DC2626', // Danger Red
  '#14B8A6', // Teal
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#64748B', // Slate
];

function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    grid: isDark ? '#1E293B' : '#E2E8F0',
    axis: isDark ? '#94A3B8' : '#64748B',
    tooltipBg: isDark ? '#0F172A' : '#FFFFFF',
    tooltipBorder: isDark ? '#334155' : '#E2E8F0',
    tooltipText: isDark ? '#F8FAFC' : '#0F172A',
    ringStroke: isDark ? '#111827' : '#FFFFFF',
  };
}

function EmptyChartNotice({ message }: { message: string }) {
  return (
    <div className="h-64 flex items-center justify-center text-center px-6">
      <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-xs">{message}</p>
    </div>
  );
}

export function CashFlowSplineChart({
  data,
  currency = 'INR',
}: {
  data: MonthlyAggregate[];
  currency?: CurrencyCode;
}) {
  const c = useChartTheme();
  const hasAny = data.some((d) => d.incomePaise > 0 || d.expensePaise > 0);
  if (!hasAny) {
    return (
      <EmptyChartNotice message="Add income or expense transactions to visualize your monthly cash flow." />
    );
  }

  const chartData = data.map((d) => ({
    label: d.label,
    Income: Math.round(d.incomePaise / 100),
    Expenses: Math.round(d.expensePaise / 100),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              formatCurrencyFromPaise(v * 100, currency, { compact: true, showDecimals: false })
            }
          />
          <Tooltip
            cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{
              backgroundColor: c.tooltipBg,
              borderColor: c.tooltipBorder,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
              color: c.tooltipText,
              fontSize: '13px',
            }}
            formatter={(value: unknown, name: unknown) => [
              formatCurrencyFromPaise(Number(value ?? 0) * 100, currency),
              String(name),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
          <Line
            type="monotone"
            dataKey="Income"
            stroke="#16A34A"
            strokeWidth={2.6}
            dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#16A34A', strokeWidth: 2 }}
            activeDot={{ r: 5.5, fill: '#16A34A', stroke: '#FFFFFF', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="Expenses"
            stroke="#DC2626"
            strokeWidth={2.6}
            dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#DC2626', strokeWidth: 2 }}
            activeDot={{ r: 5.5, fill: '#DC2626', stroke: '#FFFFFF', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeVsExpensesChart({
  data,
  currency = 'INR',
}: {
  data: MonthlyAggregate[];
  currency?: CurrencyCode;
}) {
  const c = useChartTheme();
  const hasAny = data.some((d) => d.incomePaise > 0 || d.expensePaise > 0);
  if (!hasAny) {
    return (
      <EmptyChartNotice message="Add income or expense transactions to compare monthly cash flow." />
    );
  }

  const chartData = data.map((d) => ({
    label: d.label,
    Income: Math.round(d.incomePaise / 100),
    Expenses: Math.round(d.expensePaise / 100),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              formatCurrencyFromPaise(v * 100, currency, { compact: true, showDecimals: false })
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: c.tooltipBg,
              borderColor: c.tooltipBorder,
              borderRadius: '10px',
              color: c.tooltipText,
              fontSize: '13px',
            }}
            formatter={(value: unknown) => [
              formatCurrencyFromPaise(Number(value ?? 0) * 100, currency),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Income" fill="#16A34A" radius={[6, 6, 0, 0]} maxBarSize={30} />
          <Bar dataKey="Expenses" fill="#DC2626" radius={[6, 6, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpenseDistributionChart({
  data,
  currency = 'INR',
  variant = 'pie',
  layout = 'split',
}: {
  data: CategoryBreakdownItem[];
  currency?: CurrencyCode;
  variant?: 'pie' | 'donut';
  layout?: 'split' | 'stacked';
}) {
  const c = useChartTheme();
  if (data.length === 0) {
    return <EmptyChartNotice message="No expenses recorded in this period yet." />;
  }

  const totalPaise = data.reduce((sum, item) => sum + item.amountPaise, 0);

  const chartData = data.map((item) => ({
    name: item.category,
    value: Math.round(item.amountPaise / 100),
    sharePercent: item.sharePercent,
  }));

  const isDonut = variant === 'donut';

  if (layout === 'stacked') {
    return (
      <div className="w-full space-y-4">
        <div className="relative h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={isDonut ? 56 : 0}
                outerRadius={86}
                paddingAngle={isDonut ? 3 : 1.5}
                cornerRadius={isDonut ? 6 : 2}
                stroke={c.ringStroke}
                strokeWidth={2}
              >
                {chartData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: c.tooltipBg,
                  borderColor: c.tooltipBorder,
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                  color: c.tooltipText,
                  fontSize: '13px',
                }}
                formatter={(
                  value: unknown,
                  name: unknown,
                  item: { payload?: { sharePercent?: number } },
                ) => [
                  `${formatCurrencyFromPaise(Number(value ?? 0) * 100, currency)} (${item?.payload?.sharePercent ?? 0}%)`,
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {isDonut && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">
                Total Spent
              </span>
              <span className="text-lg font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                {formatCurrencyFromPaise(totalPaise, currency, {
                  compact: true,
                  showDecimals: false,
                })}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {data.slice(0, 6).map((item, idx) => (
            <div key={item.category} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                }}
              />
              <span className="text-[#0F172A] dark:text-slate-200 font-medium">
                {item.category}
              </span>
              <span className="font-mono tabular-nums text-[#64748B] dark:text-slate-400">
                {item.sharePercent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-full sm:w-1/2 h-52 sm:h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={isDonut ? 54 : 0}
              outerRadius={84}
              paddingAngle={isDonut ? 3 : 1.5}
              cornerRadius={isDonut ? 5 : 2}
              stroke={c.ringStroke}
              strokeWidth={2}
            >
              {chartData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: c.tooltipBg,
                borderColor: c.tooltipBorder,
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                color: c.tooltipText,
                fontSize: '13px',
              }}
              formatter={(
                value: unknown,
                name: unknown,
                item: { payload?: { sharePercent?: number } },
              ) => [
                `${formatCurrencyFromPaise(Number(value ?? 0) * 100, currency)} (${item?.payload?.sharePercent ?? 0}%)`,
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {isDonut && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-medium text-[#64748B] dark:text-slate-400">
              Total
            </span>
            <span className="text-base font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
              {formatCurrencyFromPaise(totalPaise, currency, {
                compact: true,
                showDecimals: false,
              })}
            </span>
          </div>
        )}
      </div>
      <div className="w-full sm:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-1">
        {data.map((item, idx) => (
          <div key={item.category} className="flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                }}
              />
              <span className="truncate text-[#0F172A] dark:text-slate-200">{item.category}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
              <span className="text-[#64748B] dark:text-slate-400">{item.sharePercent}%</span>
              <span className="font-medium text-[#0F172A] dark:text-slate-100">
                {formatCurrencyFromPaise(item.amountPaise, currency, { showDecimals: false })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpendingTrendChart({
  data,
  currency = 'INR',
}: {
  data: Array<{ date: string; label: string; expensePaise: number; incomePaise: number }>;
  currency?: CurrencyCode;
}) {
  const c = useChartTheme();
  const hasExpenses = data.some((d) => d.expensePaise > 0);
  if (!hasExpenses) {
    return <EmptyChartNotice message="Daily spending trend will appear once expenses are logged." />;
  }

  const chartData = data.map((d) => ({
    label: d.label,
    date: d.date,
    Spending: Math.round(d.expensePaise / 100),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              formatCurrencyFromPaise(v * 100, currency, { compact: true, showDecimals: false })
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: c.tooltipBg,
              borderColor: c.tooltipBorder,
              borderRadius: '10px',
              color: c.tooltipText,
              fontSize: '13px',
            }}
            formatter={(value: unknown) => [
              formatCurrencyFromPaise(Number(value ?? 0) * 100, currency),
              'Expenses',
            ]}
          />
          <Line
            type="monotone"
            dataKey="Spending"
            stroke="#DC2626"
            strokeWidth={2.4}
            dot={{ r: 3, fill: '#FFFFFF', stroke: '#DC2626', strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SavingsTrendChart({
  data,
  currency = 'INR',
}: {
  data: MonthlyAggregate[];
  currency?: CurrencyCode;
}) {
  const c = useChartTheme();
  const hasAny = data.some((d) => d.incomePaise > 0 || d.expensePaise > 0);
  if (!hasAny) {
    return (
      <EmptyChartNotice message="Monthly savings trend will appear once income and expenses are recorded." />
    );
  }

  const chartData = data.map((d) => ({
    label: d.label,
    Savings: Math.round(d.savingsPaise / 100),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="savingsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              formatCurrencyFromPaise(v * 100, currency, { compact: true, showDecimals: false })
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: c.tooltipBg,
              borderColor: c.tooltipBorder,
              borderRadius: '10px',
              color: c.tooltipText,
              fontSize: '13px',
            }}
            formatter={(value: unknown) => [
              formatCurrencyFromPaise(Number(value ?? 0) * 100, currency),
              'Net Savings',
            ]}
          />
          <Area
            type="monotone"
            dataKey="Savings"
            stroke="#2563EB"
            strokeWidth={2.4}
            fill="url(#savingsArea)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ForecastComparisonChart({
  forecast,
  currency = 'INR',
}: {
  forecast: ExpenseForecastResult;
  currency?: CurrencyCode;
}) {
  const c = useChartTheme();
  if (!forecast.hasEnoughData || forecast.estimatedNextMonthPaise === null) {
    return (
      <EmptyChartNotice
        message={`Need expenses in all 3 previous complete months (${forecast.monthsAvailable}/3 available) to display the forecast chart.`}
      />
    );
  }

  const chartData = [
    ...forecast.historicalMonths.map((m) => ({
      label: m.label,
      Actual: Math.round(m.expensePaise / 100),
      Estimated: null as number | null,
    })),
    {
      label: `${forecast.nextMonthLabel} (Est.)`,
      Actual: null as number | null,
      Estimated: Math.round(forecast.estimatedNextMonthPaise / 100),
    },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: c.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              formatCurrencyFromPaise(v * 100, currency, { compact: true, showDecimals: false })
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: c.tooltipBg,
              borderColor: c.tooltipBorder,
              borderRadius: '10px',
              color: c.tooltipText,
              fontSize: '13px',
            }}
            formatter={(value: unknown, name: unknown) => [
              formatCurrencyFromPaise(Number(value ?? 0) * 100, currency),
              String(name),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Actual" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={42} />
          <Bar dataKey="Estimated" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
