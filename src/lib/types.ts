/**
 * Shared data shapes used across the app. These mirror the
 * database tables so TypeScript can catch mistakes for us.
 */

export type AccountType =
  | "checking"
  | "savings"
  | "credit_card"
  | "cash"
  | "investment"
  | "loan"
  | "other";

export type CategoryKind = "income" | "expense";

export type TransactionType = "income" | "expense" | "transfer";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  starting_balance: number;
  archived: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number; // always stored as a positive number; `type` gives direction
  description: string | null;
  date: string; // YYYY-MM-DD
  transfer_account_id: string | null; // set only for transfers
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string; // first day of the month, YYYY-MM-01
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  frequency: Frequency;
  next_date: string; // YYYY-MM-DD
  active: boolean;
  created_at: string;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  cash: "Cash",
  investment: "Investment",
  loan: "Loan",
  other: "Other",
};
