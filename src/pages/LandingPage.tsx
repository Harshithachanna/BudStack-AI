import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  FileSpreadsheet,
  Moon,
  PieChart as PieChartIcon,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  X,
} from 'lucide-react';
import { ExpenseDistributionChart } from '../components/charts/FinanceCharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { CategoryBreakdownItem } from '../types/finance';

type LegalModalType = 'privacy' | 'terms' | 'contact' | null;

const HERO_PREVIEW_EXPENSES: CategoryBreakdownItem[] = [
  { category: 'Housing', amountPaise: 1500000, sharePercent: 36.1, transactionCount: 1 },
  { category: 'Food', amountPaise: 850000, sharePercent: 20.5, transactionCount: 8 },
  { category: 'Transportation', amountPaise: 540000, sharePercent: 13.0, transactionCount: 5 },
  { category: 'Bills', amountPaise: 460000, sharePercent: 11.1, transactionCount: 3 },
  { category: 'Shopping', amountPaise: 420000, sharePercent: 10.1, transactionCount: 2 },
  { category: 'Healthcare', amountPaise: 380000, sharePercent: 9.2, transactionCount: 2 },
];

const FEATURES = [
  {
    index: '01',
    title: 'Smart Expense Tracking',
    description:
      'Log income and expenses across 18 tailored Indian personal finance categories in integer paise precision with instant search and filtering.',
    icon: ReceiptText,
  },
  {
    index: '02',
    title: 'Intelligent Budget Management',
    description:
      'Set monthly spending limits per category and track live utilization with automated 75%, 90%, and 100% threshold alerts.',
    icon: PiggyBank,
  },
  {
    index: '03',
    title: 'AI-Powered Financial Insights',
    description:
      'Server-side Gemini AI reviews your verified summaries to highlight top spending drivers, unusual shifts, and practical savings ideas.',
    icon: BrainCircuit,
  },
  {
    index: '04',
    title: 'Interactive Financial Analytics',
    description:
      'Compare monthly income versus expenses, category share, daily spending velocity, and net savings across custom date presets.',
    icon: BarChart3,
  },
  {
    index: '05',
    title: 'Monthly & Category Reports',
    description:
      'Filter daily, weekly, monthly, or yearly ledgers and download clean CSV statements or print-ready summaries for your records.',
    icon: FileSpreadsheet,
  },
  {
    index: '06',
    title: 'Expense Forecasting',
    description:
      'View transparent 3-month rolling average spending estimates clearly separated from actual recorded transactions.',
    icon: TrendingUp,
  },
];

const STEPS = [
  {
    step: 'Step 01',
    title: 'Create your account',
    detail: 'Sign in securely with Google or email verification. Every user ledger is isolated in Cloud Firestore.',
  },
  {
    step: 'Step 02',
    title: 'Record your income and expenses',
    detail: 'Add real transactions in INR or explore first with clearly labeled sample starter records.',
  },
  {
    step: 'Step 03',
    title: 'Analyze your finances',
    detail: 'Monitor category budgets, savings rate, and month-over-month cash flow trends in real time.',
  },
  {
    step: 'Step 04',
    title: 'Receive intelligent insights',
    detail: 'Generate structured Gemini AI observations grounded strictly in your verified numbers.',
  },
];

export function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [heroChartVariant, setHeroChartVariant] = useState<'pie' | 'donut'>('pie');

  const ctaTarget = user ? '/dashboard' : '/register';

  return (
    <div id="home" className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F8FAFC]">
      {/* Strictly 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] dark:border-slate-800 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#home"
            className="text-lg font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap shrink-0"
          >
            BudStack AI
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#64748B] dark:text-slate-400">
            <a
              href="#home"
              className="hover:text-[#0F172A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#features"
              className="hover:text-[#0F172A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#about"
              className="hover:text-[#0F172A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="hover:text-[#0F172A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {user ? 'Dashboard' : 'Login'}
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={ctaTarget}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              {user ? 'Open Dashboard' : 'Get Started'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.12),transparent_55%)]"
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Column: Headline + CTAs + Expense Analysis Pie Chart filling the lower-left corner */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-8">
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-slate-400">
                  <span>Personal Finance Intelligence</span>
                  <span aria-hidden="true">·</span>
                  <span>INR (₹)</span>
                  <span aria-hidden="true">·</span>
                  <span>Asia/Kolkata</span>
                </div>

                <h1 className="text-[clamp(2.1rem,3.6vw,3.1rem)] font-bold leading-[1.12] tracking-tight text-[#0F172A] dark:text-[#F8FAFC] [text-wrap:balance]">
                  Take Control of Your Money. Understand Every Rupee.
                </h1>

                <p className="text-base text-[#64748B] dark:text-slate-400 leading-relaxed max-w-xl">
                  Track your spending, manage your budgets, and discover smarter financial habits
                  with AI-powered insights. Built for students and professionals who want clarity
                  over every month.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to={ctaTarget}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <span>{user ? 'Go to Dashboard' : 'Get Started'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={user ? '/dashboard' : '/login'}
                    className="inline-flex items-center rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    {user ? 'Open Dashboard' : 'Sign In'}
                  </Link>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Toggle color theme"
                    className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-[#64748B] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expense Analysis Pie Chart in the Lower-Left Corner */}
              <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-8 w-8 rounded-full bg-[#2563EB]/10 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <PieChartIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Expense Analysis (Pie Chart)
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                        Sample monthly category share · ₹41,500 spent
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setHeroChartVariant('pie')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        heroChartVariant === 'pie'
                          ? 'bg-white dark:bg-slate-800 text-[#2563EB] shadow-xs'
                          : 'text-[#64748B] dark:text-slate-400'
                      }`}
                    >
                      Pie
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroChartVariant('donut')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        heroChartVariant === 'donut'
                          ? 'bg-white dark:bg-slate-800 text-[#2563EB] shadow-xs'
                          : 'text-[#64748B] dark:text-slate-400'
                      }`}
                    >
                      Ring
                    </button>
                  </div>
                </div>
                <ExpenseDistributionChart
                  data={HERO_PREVIEW_EXPENSES}
                  currency="INR"
                  variant={heroChartVariant}
                  layout="split"
                />
              </div>
            </div>

            {/* Right Column: Monthly Cash Flow Overview & AI Observation Preview */}
            <div className="lg:col-span-6 flex">
              <div className="w-full rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
                    <div>
                      <p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">
                        Illustrative Workspace Preview
                      </p>
                      <p className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
                        Monthly Cash Flow Overview
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-mono tabular-nums text-[#16A34A] font-semibold">
                      +28.4% Savings Rate
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-5 border-b border-[#E2E8F0] dark:border-slate-800">
                    <div>
                      <p className="text-xs text-[#64748B] dark:text-slate-400">Income</p>
                      <p className="mt-1 text-lg sm:text-xl font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                        ₹58,000
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B] dark:text-slate-400">Expenses</p>
                      <p className="mt-1 text-lg sm:text-xl font-bold font-mono tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                        ₹41,500
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B] dark:text-slate-400">Net Saved</p>
                      <p className="mt-1 text-lg sm:text-xl font-bold font-mono tabular-nums text-[#16A34A]">
                        ₹16,500
                      </p>
                    </div>
                  </div>

                  <div className="py-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-[#0F172A] dark:text-slate-200">
                          Housing &amp; Utilities
                        </span>
                        <span className="font-mono tabular-nums text-[#64748B] dark:text-slate-400">
                          ₹15,000 / ₹18,000 (83%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full w-[83%] rounded-full bg-[#F59E0B]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-[#0F172A] dark:text-slate-200">
                          Food &amp; Groceries
                        </span>
                        <span className="font-mono tabular-nums text-[#64748B] dark:text-slate-400">
                          ₹8,500 / ₹12,000 (71%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full w-[71%] rounded-full bg-[#2563EB]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-[#0F172A] dark:text-slate-200">
                          Transportation
                        </span>
                        <span className="font-mono tabular-nums text-[#64748B] dark:text-slate-400">
                          ₹5,400 / ₹8,000 (68%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full w-[68%] rounded-full bg-[#16A34A]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] p-4 text-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-white text-[#6366F1] flex items-center justify-center shrink-0">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-xs font-semibold text-white">Gemini AI Observation</p>
                    </div>
                    <Link
                      to={user ? '/dashboard' : '/login'}
                      className="text-[11px] font-semibold text-white/90 hover:text-white underline underline-offset-2"
                    >
                      {user ? 'View Live Dashboard' : 'Sign in for Live AI'}
                    </Link>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-white/95 leading-relaxed">
                    Housing and Food represent 56.6% of this month&apos;s recorded expenses. Try
                    keeping dining out under ₹2,500 this week to hit a 30% savings rate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A] py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Built for Complete Financial Clarity
            </h2>
            <p className="mt-3 text-base text-[#64748B] dark:text-slate-400">
              Every module reads directly from your private Firestore ledger and performs exact
              calculations in integer minor units.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.index}
                  className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#111827] p-6 transition-colors hover:border-[#2563EB]/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#64748B] dark:text-slate-400">
                      {feat.index}.
                    </span>
                    <Icon className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-[#E2E8F0] dark:border-slate-800 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              How BudStack AI Works
            </h2>
            <p className="mt-3 text-base text-[#64748B] dark:text-slate-400">
              From raw daily receipts to structured monthly forecasts in four straightforward steps.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6"
              >
                <p className="text-xs font-mono font-medium text-[#2563EB]">{item.step}</p>
                <h3 className="mt-2.5 text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About & Security Section */}
      <section
        id="about"
        className="border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A] py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Privacy-Conscious Personal Finance Architecture
            </h2>
            <p className="text-base text-[#64748B] dark:text-slate-400 leading-relaxed">
              BudStack AI keeps every user&apos;s transactions, budgets, and AI insights isolated
              under authenticated Firebase paths protected by strict Firestore security rules.
              Mathematical totals are always computed deterministically in application code—never
              guessed by a language model—and Gemini AI runs strictly on the server.
            </p>
          </div>
          <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#111827] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  No bank credentials required
                </p>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                  You stay in full control of what you log, edit, or export to CSV at any time.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link
                to={ctaTarget}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {user ? 'Return to Dashboard' : 'Create Free Account'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#64748B] dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">BudStack AI</span>
            <span>·</span>
            <span>© {new Date().getFullYear()} BudStack AI</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#about" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">
              About
            </a>
            <a
              href="#features"
              className="hover:text-[#0F172A] dark:hover:text-white transition-colors"
            >
              Features
            </a>
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="hover:text-[#0F172A] dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="hover:text-[#0F172A] dark:hover:text-white transition-colors"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('contact')}
              className="hover:text-[#0F172A] dark:hover:text-white transition-colors"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>

      {/* Footer Modal for Privacy / Terms / Contact */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
              <h3 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {legalModal === 'privacy'
                  ? 'Privacy Policy'
                  : legalModal === 'terms'
                    ? 'Terms of Use'
                    : 'Contact BudStack AI'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                aria-label="Close modal"
                className="p-1 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 text-sm text-[#64748B] dark:text-slate-300 space-y-3 leading-relaxed">
              {legalModal === 'privacy' && (
                <>
                  <p>
                    Your financial records, budgets, and AI insight history are stored exclusively
                    under your authenticated Firebase user ID and cannot be accessed by other users.
                  </p>
                  <p>
                    When you request AI insights, only aggregated category and monthly summaries are
                    sent to the server-side Gemini API—never bank credentials or account numbers.
                  </p>
                </>
              )}
              {legalModal === 'terms' && (
                <>
                  <p>
                    BudStack AI is a personal finance tracking and educational intelligence tool.
                    Forecasts use a simple 3-month rolling average and AI suggestions are provided
                    for informational purposes only—not certified financial, tax, or investment advice.
                  </p>
                </>
              )}
              {legalModal === 'contact' && (
                <>
                  <p>
                    Need help setting up your account or exporting reports? Reach out via your
                    workspace settings or project repository documentation.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
