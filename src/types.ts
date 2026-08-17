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
  debtPaidDate?: string;
  countAsExpense?: boolean;
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
  hidden?: boolean;
}

export interface PersistedState {
  transactions: Transaction[];
  budgets: Record<string, number>;
  currency: string;
  showCalculator: boolean;
  showEUR: boolean;
  showCustomRate: boolean;
  customRate: number | null;
  language: "es" | "en";
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
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel?: (() => void) | null;
}

export type PageId = "home" | "transactions" | "stats" | "settings";
export type FilterType = "all" | "expense" | "income" | "debt" | "future";
