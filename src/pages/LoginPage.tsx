import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  loginWithEmail,
  mapAuthErrorMessage,
  signInWithGoogle,
} from '../services/authService';

export function LoginPage() {
  const { user, loading } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      showSuccess('Welcome back to BudStack AI.');
      navigate('/dashboard');
    } catch (err) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      showSuccess('Signed in with Google.');
      navigate('/dashboard');
    } catch (err) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]"
        >
          BudStack AI
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
          Sign in to your account
        </h1>
        <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-400">
          Access your private INR ledger, budgets, and AI insights.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-sm">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-4 py-3 text-sm text-[#DC2626]"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E2E8F0] dark:bg-slate-800" />
            <span className="text-xs text-[#64748B] dark:text-slate-400">or sign in with email</span>
            <div className="h-px flex-1 bg-[#E2E8F0] dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3.5 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-10 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748B] dark:text-slate-400">
            New to BudStack AI?{' '}
            <Link to="/register" className="font-medium text-[#2563EB] hover:underline">
              Create an account
            </Link>
          </p>

          <div className="mt-5 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/70 p-3.5 text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
            <p className="font-semibold text-[#0F172A] dark:text-slate-200 mb-1">
              Exploring with sample data?
            </p>
            <p>
              Sign in with Google (or create &amp; verify an email account) to open your Dashboard
              at <span className="font-mono text-[#2563EB]">/dashboard</span>, then click{' '}
              <span className="font-medium text-[#0F172A] dark:text-slate-200">
                Load Sample Starter Data
              </span>{' '}
              to populate 4 months of sample INR transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
