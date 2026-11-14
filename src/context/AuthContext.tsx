import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { ensureUserProfile } from '../services/authService';
import { auth, formatFriendlyFirestoreError } from '../services/firebase';
import type { UserProfile } from '../types/finance';
import { useTheme } from './ThemeContext';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
  reloadUserAndProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfileForUser = useCallback(
    async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setProfile(null);
        setProfileError(null);
        return;
      }

      if (!firebaseUser.emailVerified) {
        setProfile(null);
        setProfileError(null);
        return;
      }

      try {
        setProfileError(null);
        const loaded = await ensureUserProfile(firebaseUser, theme);
        setProfile(loaded);
        if (loaded?.theme) {
          setTheme(loaded.theme);
        }
      } catch (err) {
        setProfileError(formatFriendlyFirestoreError(err));
      }
    },
    [setTheme, theme],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await loadProfileForUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadProfileForUser]);

  const reloadUserAndProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    setUser(refreshed ? ({ ...refreshed } as User) : null);
    if (refreshed) {
      await loadProfileForUser(refreshed);
    }
  }, [loadProfileForUser]);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      await loadProfileForUser(auth.currentUser);
    }
  }, [loadProfileForUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileError,
        reloadUserAndProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
