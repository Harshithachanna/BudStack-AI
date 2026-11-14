import type { CurrencyCode, Transaction } from '../types/finance';

function escapeCsvField(value: string): string {
  const safe = value.replace(/\r?\n/g, ' ');
  if (safe.includes(',') || safe.includes('"') || safe.includes(';')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function exportTransactionsToCsv(
  transactions: Transaction[],
  filename: string,
  currency: CurrencyCode = 'INR',
): void {
  const headers = ['Date', 'Description', 'Category', 'Type', `Amount (${currency})`];

  const rows = transactions.map((tx) => {
    const amountDecimal = (tx.amountPaise / 100).toFixed(2);
    return [
      escapeCsvField(tx.transactionDate),
      escapeCsvField(tx.description),
      escapeCsvField(tx.category),
      escapeCsvField(tx.type === 'income' ? 'Income' : 'Expense'),
      escapeCsvField(amountDecimal),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
