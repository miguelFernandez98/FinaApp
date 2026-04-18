export interface Transaction {
  id: string
  type: 'expense' | 'income'
  amount: number
  category: string
  description: string
  date: string
  createdAt: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'expense' | 'income'
}

export interface AppState {
  transactions: Transaction[]
  budgets: Record<string, number>
  currency: string
}

export interface ToastState {
  visible: boolean
  message: string
  icon: string
  color: string
}

export interface ConfirmState {
  visible: boolean
  title: string
  message: string
  onConfirm: (() => void) | null
}

export type PageId = 'home' | 'transactions' | 'stats' | 'profile'
export type FilterType = 'all' | 'expense' | 'income'