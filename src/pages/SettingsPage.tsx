import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { logoutUser, updateUserProfileSettings } from '../services/authService';
import type { CurrencyCode, ThemeMode } from '../types/finance';

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [currency, setCurrency] = useState<CurrencyCode>(profile?.preferredCurrency ?? 'INR');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    profile?.notificationsEnabled ?? true,
  );
  const [alertThreshold, setAlertThreshold] = useState<number>(
    profile?.budgetAlertThreshold ?? 75,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setCurrency(profile.preferredCurrency);
      setNotificationsEnabled(profile.notificationsEnabled);
      setAlertThreshold(profile.budgetAlertThreshold);
    }
  }, [profile]);

  const handleThemeSelect = async (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    if (user) {
      try {
        await updateUserProfileSettings(user.uid, { theme: nextTheme });
        await refreshProfile();
        showSuccess(`Switched to ${nextTheme} theme.`);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Unable to save theme preference.');
      }
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfileSettings(user.uid, {
        preferredCurrency: currency,
        notificationsEnabled,
        budgetAlertThreshold: alertThreshold,
      });
      await refreshProfile();
      showSuccess('Preferences saved to your profile.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <AppShell title="Settings" subtitle="Configure appearance, currency display, and budget alerts">
      <div className="max-w-2xl space-y-6">
        {/* Appearance */}
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
          <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            Appearance
          </h2>
          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
            Choose Light or Dark theme. Saved locally and synced to your Firestore profile.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleThemeSelect('light')}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3.5 text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                  : 'border-[#E2E8F0] dark:border-slate-700 text-[#64748B] dark:text-slate-300'
              }`}
            >
              <Sun className="h-4 w-4" />
              Light Mode
            </button>
            <button
              type="button"
              onClick={() => handleThemeSelect('dark')}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3.5 text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'border-[#2563EB] bg-[#2563EB]/20 text-blue-400'
                  : 'border-[#E2E8F0] dark:border-slate-700 text-[#64748B] dark:text-slate-300'
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark Mode
            </button>
          </div>
        </div>

        {/* Currency & Budget Notifications */}
        <form
          onSubmit={handleSavePreferences}
          className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5"
        >
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              Currency &amp; Alert Preferences
            </h2>
            <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
              Default timezone is Asia/Kolkata. Currency formatting updates across all charts and
              tables.
            </p>
          </div>

          <div>
            <label
              htmlFor="settings-currency"
              className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
            >
              Display Currency
            </label>
            <select
              id="settings-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC]"
            >
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
            <div>
              <label
                htmlFor="settings-notif"
                className="text-sm font-medium text-[#0F172A] dark:text-slate-200"
              >
                In-App Budget Threshold Alerts
              </label>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Highlight budgets in the notification bell when spending crosses your threshold.
              </p>
            </div>
            <input
              id="settings-notif"
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#2563EB]"
            />
          </div>

          <div>
            <label
              htmlFor="settings-threshold"
              className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
            >
              Alert Trigger Threshold ({alertThreshold}%)
            </label>
            <select
              id="settings-threshold"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC]"
            >
              <option value={50}>50% of monthly budget</option>
              <option value={75}>75% of monthly budget (Recommended)</option>
              <option value={90}>90% of monthly budget</option>
              <option value={100}>100% (Budget exceeded only)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving Preferences...' : 'Save Preferences'}
          </button>
        </form>

        {/* Session / Logout */}
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              Account Session
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Sign out of BudStack AI on this browser.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-[#DC2626]/40 px-4 py-2 text-sm font-medium text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </AppShell>
  );
}
