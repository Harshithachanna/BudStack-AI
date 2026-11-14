import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import type { CurrencyCode, ThemeMode, UserProfile } from '../types/finance';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';

export function mapAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please check your credentials and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completion. Please try again.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication > Sign-in method). Use Google Sign-In or enable Email/Password in Firebase Console.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  }
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const trimmedName = name.trim().slice(0, 100);
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (trimmedName) {
    await updateProfile(credential.user, { displayName: trimmedName });
  }
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function resendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

function parseTimestamp(val: unknown): Date | null {
  if (!val) return null;
  if (typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate();
  }
  return null;
}

export async function ensureUserProfile(
  user: User,
  fallbackTheme: ThemeMode = 'light',
): Promise<UserProfile | null> {
  if (!user.emailVerified || !user.email) {
    return null;
  }

  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: String(data.uid ?? user.uid),
        name: String(data.name ?? user.displayName ?? 'BudStack User'),
        email: String(data.email ?? user.email),
        preferredCurrency: (data.preferredCurrency as CurrencyCode) ?? 'INR',
        theme: (data.theme as ThemeMode) ?? fallbackTheme,
        notificationsEnabled: Boolean(data.notificationsEnabled ?? true),
        budgetAlertThreshold: Number(data.budgetAlertThreshold ?? 75),
        createdAt: parseTimestamp(data.createdAt),
        updatedAt: parseTimestamp(data.updatedAt),
      };
    }

    const displayName = (user.displayName || user.email.split('@')[0] || 'BudStack User')
      .trim()
      .slice(0, 100);

    const payload = {
      uid: user.uid,
      name: displayName,
      email: user.email.slice(0, 254),
      preferredCurrency: 'INR',
      theme: fallbackTheme,
      notificationsEnabled: true,
      budgetAlertThreshold: 75,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, payload);

    return {
      uid: user.uid,
      name: displayName,
      email: user.email,
      preferredCurrency: 'INR',
      theme: fallbackTheme,
      notificationsEnabled: true,
      budgetAlertThreshold: 75,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function updateUserProfileSettings(
  uid: string,
  updates: {
    name?: string;
    preferredCurrency?: CurrencyCode;
    theme?: ThemeMode;
    notificationsEnabled?: boolean;
    budgetAlertThreshold?: number;
  },
): Promise<void> {
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  const sanitized: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (typeof updates.name === 'string') {
    const clean = updates.name.trim().slice(0, 100);
    if (!clean) throw new Error('Name cannot be empty.');
    sanitized.name = clean;
  }
  if (updates.preferredCurrency) {
    sanitized.preferredCurrency = updates.preferredCurrency;
  }
  if (updates.theme) {
    sanitized.theme = updates.theme;
  }
  if (typeof updates.notificationsEnabled === 'boolean') {
    sanitized.notificationsEnabled = updates.notificationsEnabled;
  }
  if (typeof updates.budgetAlertThreshold === 'number') {
    sanitized.budgetAlertThreshold = Math.min(100, Math.max(50, Math.round(updates.budgetAlertThreshold)));
  }

  try {
    await updateDoc(userRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}
