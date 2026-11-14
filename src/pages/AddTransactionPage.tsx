import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createTransaction } from '../services/transactionService';
import type { TransactionInput } from '../types/finance';

export function AddTransactionPage() {
  const { user } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (input: TransactionInput) => {
    if (!user) return;
    await createTransaction(user.uid, input);
    showSuccess('Transaction added successfully.');
    navigate('/transactions');
  };

  return (
    <AppShell
      title="Add Transaction"
      subtitle="Record a new income or expense entry to your Firestore ledger"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Link>

        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
            New Financial Entry
          </h2>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Amounts are stored in integer minor units (paise) for exact financial math.
          </p>

          <TransactionForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/transactions')}
          />
        </div>
      </div>
    </AppShell>
  );
}
