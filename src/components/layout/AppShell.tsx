import React, { useMemo, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BrainCircuit,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  PlusCircle,
  ReceiptText,
  Settings,
  Sun,
  Trash2,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { logoutUser, updateUserProfileSettings } from '../../services/authService';
import { clearSampleTransactions } from '../../services/transactionService';
import { computeBudgetsWithUsage } from '../../utils/calculations';
import { formatCurrencyFromPaise, getKolkataCurrentMonthYear, getMonthLabel } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ReceiptText },
  { to: '/transactions/new', label: 'Add Transaction', icon: PlusCircle },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/insights', label: 'AI Insights', icon: BrainCircuit },
  { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
  { to: '/profile', label: 'Profile', icon: UserCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const { user, profile } = useAuth();
  const { transactions, budgets, hasSampleData } = useFinanceData();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmClearSample, setConfirmClearSample] = useState(false);
  const [clearingSample, setClearingSample] = useState(false);

  const currentMY = getKolkataCurrentMonthYear();
  const currency = profile?.preferredCurrency ?? 'INR';

  const activeAlerts = useMemo(() => {
    const withUsage = computeBudgetsWithUsage(budgets, transactions, currentMY.year, currentMY.month);
    const threshold = profile?.budgetAlertThreshold ?? 75;
    return withUsage.filter((b) => b.utilizationPercent >= threshold);
  }, [budgets, transactions, currentMY.year, currentMY.month, profile?.budgetAlertThreshold]);

  const handleToggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    if (user) {
      try {
        await updateUserProfileSettings(user.uid, { theme: next });
      } catch {
        // Local theme already toggled
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch {
      showError('Failed to sign out. Please try again.');
    }
  };

  const handleClearSample = async () => {
    if (!user) return;
    setClearingSample(true);
    try {
      const removed = await clearSampleTransactions(user.uid, transactions);
      showSuccess(`Removed ${removed} sample transactions.`);
      setConfirmClearSample(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to clear sample transactions.');
    } finally {
      setClearingSample(false);
    }
  };

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-[#0F172A] border-r border-[#E2E8F0] dark:border-slate-800">
      <div>
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#E2E8F0] dark:border-slate-800">
          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="text-lg font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap"
          >
            BudStack AI
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden rounded-md p-1.5 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400'
                      : 'text-[#64748B] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-[#0F172A] dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-[#E2E8F0] dark:border-slate-800 space-y-2">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] truncate">
            {profile?.name || user?.displayName || 'BudStack User'}
          </p>
          <p className="text-xs text-[#64748B] dark:text-slate-400 truncate">
            {profile?.email || user?.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#64748B] dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-[#DC2626] transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-50">{SidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xs border-b border-[#E2E8F0] dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-lg p-2 text-[#64748B] hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block text-xs text-[#64748B] dark:text-slate-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden md:inline-block text-xs text-[#64748B] dark:text-slate-400 whitespace-nowrap">
              {getMonthLabel(currentMY.year, currentMY.month)}
            </span>

            {actions}

            {/* Budget Alerts Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Budget alerts"
                className="relative rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-2 text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="h-4 w-4" />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-semibold text-white">
                    {activeAlerts.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] shadow-lg p-4 z-30">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0] dark:border-slate-800">
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      Budget Alerts
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  {activeAlerts.length === 0 ? (
                    <p className="py-4 text-xs text-[#64748B] dark:text-slate-400">
                      All active budgets for {getMonthLabel(currentMY.year, currentMY.month)} are
                      within your alert threshold.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2.5 max-h-64 overflow-y-auto">
                      {activeAlerts.map((b) => (
                        <li
                          key={b.id}
                          className="text-xs border-b border-[#E2E8F0] dark:border-slate-800/70 pb-2 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between font-medium">
                            <span className="text-[#0F172A] dark:text-slate-100">{b.category}</span>
                            <span
                              className={
                                b.utilizationPercent > 100
                                  ? 'text-[#DC2626]'
                                  : b.utilizationPercent >= 90
                                    ? 'text-[#F59E0B]'
                                    : 'text-[#2563EB]'
                              }
                            >
                              {b.utilizationPercent}% used
                            </span>
                          </div>
                          <p className="mt-0.5 text-[#64748B] dark:text-slate-400 font-mono tabular-nums">
                            {formatCurrencyFromPaise(b.spentPaise, currency)} of{' '}
                            {formatCurrencyFromPaise(b.monthlyLimitPaise, currency)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    to="/budgets"
                    onClick={() => setNotifOpen(false)}
                    className="mt-3 block text-center text-xs font-medium text-[#2563EB] hover:underline"
                  >
                    Manage Budgets
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-2 text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/transactions/new"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Entry
            </Link>
          </div>
        </header>

        {hasSampleData && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-amber-900 dark:text-amber-200">
              <span className="font-semibold">Sample Starter Data Active:</span> Entries labeled{' '}
              <span className="font-medium">Sample</span> are illustrative starter transactions so
              you can test charts, forecasting, and AI insights.
            </p>
            <button
              type="button"
              onClick={() => setConfirmClearSample(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Sample Data
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      <ConfirmDialog
        open={confirmClearSample}
        title="Clear all sample transactions?"
        description="This will remove all transactions marked as Sample from your Firestore database. Any organic transactions you added manually will remain untouched."
        confirmLabel="Clear Sample Data"
        loading={clearingSample}
        onConfirm={handleClearSample}
        onCancel={() => setConfirmClearSample(false)}
      />
    </div>
  );
}
