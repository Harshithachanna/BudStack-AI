import React, { useEffect, useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { Mail, ShieldCheck, UserCircle } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateUserProfileSettings } from '../services/authService';
import { formatDateTimeKolkata } from '../utils/formatters';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.name || user?.displayName || '');
  }, [profile?.name, user?.displayName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      showError('Display name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user, { displayName: trimmed });
      await updateUserProfileSettings(user.uid, { name: trimmed });
      await refreshProfile();
      showSuccess('Profile updated successfully.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Profile" subtitle="Manage your BudStack AI identity and account details">
      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
          <div className="flex items-center gap-4 pb-6 border-b border-[#E2E8F0] dark:border-slate-800">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB]/10 text-[#2563EB]">
              <UserCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {profile?.name || user?.displayName || 'BudStack User'}
              </h2>
              <p className="text-sm text-[#64748B] dark:text-slate-400">
                {profile?.email || user?.email}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                maxLength={100}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5"
              >
                Email Address (Verified)
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  id="profile-email"
                  type="email"
                  disabled
                  value={profile?.email || user?.email || ''}
                  className="w-full rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pl-10 pr-3.5 py-2.5 text-sm text-[#64748B] dark:text-slate-400 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                Email is bound to your Firebase Authentication credential for security.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0] dark:border-slate-800 text-xs">
              <div>
                <span className="text-[#64748B] dark:text-slate-400">Account Created</span>
                <p className="mt-1 font-medium text-[#0F172A] dark:text-slate-200">
                  {formatDateTimeKolkata(
                    profile?.createdAt ??
                      (user?.metadata.creationTime ? new Date(user.metadata.creationTime) : null),
                  )}
                </p>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-slate-400">Verification Status</span>
                <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-[#16A34A]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Account
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
