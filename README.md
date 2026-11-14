# BudStack AI — Personal Finance & Expense Intelligence Dashboard

BudStack AI is a full-stack personal finance and expense intelligence web application built with React, TypeScript, Tailwind CSS, Express, Firebase Authentication, Cloud Firestore, and the Google Gemini API (`@google/genai`).

## Key Capabilities
- **Authentication & Privacy**: Google Sign-In and Email/Password authentication with mandatory email verification and user-isolated Firestore paths (`users/{userId}`).
- **Transactions Ledger**: Add, edit, delete, search, filter, and sort income/expense transactions stored in integer minor units (paise) to avoid floating-point drift.
- **Monthly Budgets & Alerts**: Set monthly category spending limits with duplicate prevention and automated 75%, 90%, and 100%+ utilization alerts.
- **Interactive Analytics & Forecasting**: Recharts visualizations across 7 date presets plus a transparent 3-month rolling average expense forecast clearly separated from actuals.
- **Server-Side Gemini AI Insights**: Summarized, privacy-conscious financial metrics are analyzed by Gemini on the Express backend (`POST /api/insights/generate`) after verifying the caller's Firebase ID token.
- **Reports & Export**: Daily, weekly, monthly, yearly, income, expense, category-wise, and savings reports with CSV export and print/PDF support.
- **Theme Support**: Persistent Light and Dark mode.

## Project Structure
- `server.ts` — Express server serving Vite dev middleware (dev) or built static assets (prod) plus API routes.
- `server/middleware/auth.ts` — Server-side Firebase ID token verification.
- `server/services/geminiService.ts` — Server-side `@google/genai` integration (`gemini-4-hydrogen`) with structured JSON output.
- `server/routes/insights.ts` — Authenticated `POST /api/insights/generate` endpoint.
- `src/services/` — Firebase initialization, Auth, Transactions, Budgets, and AI client services.
- `src/utils/` — Integer-paise financial math, `Asia/Kolkata` date helpers, 3-month forecasting, and CSV export.
- `src/pages/` — Landing, Login, Register, Dashboard, Transactions, Add Transaction, Budgets, Analytics, AI Insights, Reports, Profile, and Settings pages.
- `firestore.rules` & `firebase-blueprint.json` — Schema blueprint and hardened Firestore security rules.

## Firebase Console Note
Google Sign-In is configured automatically. If you use Email/Password sign-up, enable the **Email/Password** provider in Firebase Console → Authentication → Sign-in method for project `fit-xyston-c7cvm`.
