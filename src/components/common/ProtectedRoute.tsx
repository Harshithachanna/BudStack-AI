import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { MailCheck, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logoutUser, resendVerificationEmail } from '../../services/authService';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profileError, reloadUserAndProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
          <p className="text-sm text-[#64748B] dark:text-slate-400">Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!user.emailVerified) {
    const handleResend = async () => {
      setResending(true);
      try {
        await resendVerificationEmail(user);
        showSuccess('Verification email sent. Please check your inbox and spam folder.');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Unable to send verification email.');
      } finally {
        setResending(false);
      }
    };

    const handleCheck = async () => {
      setChecking(true);
      try {
        await reloadUserAndProfile();
        if (!user.emailVerified) {
          showError('Email is not verified yet. Click the link in your inbox, then try again.');
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Could not refresh verification status.');
      } finally {
        setChecking(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120] px-4">
        <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Verify your email to continue
          </h1>
          <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
            For your financial data security, BudStack AI requires a verified email before opening
            your private ledger. We sent a verification link to{' '}
            <span className="font-medium text-[#0F172A] dark:text-slate-200">{user.email}</span>.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking status...' : "I've verified my email"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {resending ? 'Sending link...' : 'Resend verification email'}
            </button>

            <button
              type="button"
              onClick={() => void logoutUser()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0F172A] dark:hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120] px-4">
        <div className="w-full max-w-md rounded-xl border border-[#DC2626]/30 bg-white dark:bg-[#111827] p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Unable to load your profile
          </h2>
          <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400">{profileError}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => void reloadUserAndProfile()}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => void logoutUser()}
              className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-4 py-2 text-sm font-medium text-[#0F172A] dark:text-slate-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
