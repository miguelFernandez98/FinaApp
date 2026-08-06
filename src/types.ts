export type TransactionType = "expense" | "income" | "debt";
export type DebtStatus = "pending" | "partial" | "paid";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: number;
  debtStatus?: DebtStatus;
  debtPaidAmount?: number;
  debtDueDate?: string;
  isRecurring?: boolean;
  recurrenceDays?: number[];
  recurringId?: string;
  recurringBackfill?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface PersistedState {
  transactions: Transaction[];
  budgets: Record<string, number>;
  currency: string;
}

export interface ToastState {
  visible: boolean;
  message: string;
  icon: string;
  color: string;
}

export interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
}

export type PageId = "home" | "transactions" | "stats" | "settings";
export type FilterType = "all" | "expense" | "income" | "debt" | "future";
