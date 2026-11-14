# BudStack AI — Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document in `/users/{userId}` and its subcollections (`transactions`, `budgets`, `insights`) belongs exclusively to `userId` (`request.auth.uid == userId`). No user can read, list, create, update, or delete another user's financial data.
2. **Email Verification Gate**: All authenticated read/write operations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Parent Integrity (Master Gate)**: A `transaction`, `budget`, or `insight` cannot be created unless the parent `/users/{userId}` profile document exists.
4. **Immutable Ownership & Creation Timestamps**: `uid`, `userId`, and `createdAt` cannot be modified after creation. `createdAt` and `generatedAt` must equal `request.time` on creation; `updatedAt` must equal `request.time` on creation and update.
5. **Integer Monetary Precision & Positive Bounds**: `amountPaise` and `monthlyLimitPaise` must be positive integers (`> 0` and `<= 100000000000`).
6. **Strict Schema Enforcement**: Every `create` checks `hasAll` and `hasOnly`; every `update` checks `affectedKeys().hasOnly(...)` and runs `isValid[Entity](incoming())`.
7. **ID Poisoning Guard**: All document IDs (`userId`, `transactionId`, `budgetId`, `insightId`) must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Cross-User Read/List**: User A attempts to `get` or `list` `/users/userB/transactions`.
2. **Unverified Email Write**: User with `email_verified: false` attempts to create a transaction.
3. **Identity Spoofing on Create**: User A creates `/users/userA/transactions/tx1` with `userId: "userB"`.
4. **Shadow Field Injection**: User A creates a transaction with extra `"isAdmin": true` or `"verified": true` key.
5. **Negative / Zero / Float Amount**: User A creates a transaction with `amountPaise: -500`, `0`, or `12.34`.
6. **Future/Fake Timestamp Spoofing**: User A creates a transaction with a backdated `createdAt` not equal to `request.time`.
7. **Immutable Field Mutation**: User A updates a transaction trying to change `createdAt` or `userId`.
8. **Invalid Transaction Type**: User A creates a transaction with `type: "transfer"` instead of `"income"` or `"expense"`.
9. **Oversized Description (Denial of Wallet)**: User A creates a transaction with a 5,000-char `description`.
10. **Malformed Date String**: User A creates a transaction with `transactionDate: "14/11/2026"` instead of `YYYY-MM-DD`.
11. **Path ID Poisoning**: User A attempts to write to `/users/userA/transactions/invalid$id*123`.
12. **Unbounded Array Injection**: User A creates an insight with `observations` containing > 10 items.
