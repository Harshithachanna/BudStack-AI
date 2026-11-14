import type { CurrencyCode } from '../types/finance';

export const APP_TIMEZONE = 'Asia/Kolkata';

const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; symbol: string }> = {
  INR: { locale: 'en-IN', symbol: '₹' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'de-DE', symbol: '€' },
  GBP: { locale: 'en-GB', symbol: '£' },
};

export function formatCurrencyFromPaise(
  paise: number,
  currency: CurrencyCode = 'INR',
  options?: { compact?: boolean; showDecimals?: boolean; signed?: boolean },
): string {
  const safePaise = Number.isFinite(paise) ? Math.round(paise) : 0;
  const isNegative = safePaise < 0;
  const absRupees = Math.abs(safePaise) / 100;
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.INR;

  const showDecimals = options?.showDecimals ?? absRupees % 1 !== 0;

  if (options?.compact && absRupees >= 100000 && currency === 'INR') {
    const formatted =
      absRupees >= 10000000
        ? `${(absRupees / 10000000).toFixed(2)} Cr`
        : `${(absRupees / 100000).toFixed(2)} L`;
    const prefix = isNegative ? '-' : options?.signed && safePaise > 0 ? '+' : '';
    return `${prefix}${config.symbol}${formatted}`;
  }

  const formatter = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  const formatted = formatter.format(absRupees);
  if (isNegative) return `-${formatted}`;
  if (options?.signed && safePaise > 0) return `+${formatted}`;
  return formatted;
}

export function getKolkataTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function getKolkataCurrentMonthYear(): { month: number; year: number } {
  const iso = getKolkataTodayISO();
  const [y, m] = iso.split('-').map(Number);
  return { month: m, year: y };
}

export function getMonthLabel(year: number, month: number, short = false): string {
  const date = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat('en-IN', {
    month: short ? 'short' : 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDisplayDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDateTimeKolkata(date: Date | null | undefined): string {
  if (!date) return 'Just now';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function shiftISOByDays(isoDate: string, daysDelta: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + daysDelta);
  return dt.toISOString().slice(0, 10);
}

export function getPreviousMonthYear(year: number, month: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

export function getNextMonthYear(year: number, month: number): { month: number; year: number } {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}

export function toBudgetDocId(year: number, month: number, category: string): string {
  const slug = category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${year}-${String(month).padStart(2, '0')}-${slug}`;
}
