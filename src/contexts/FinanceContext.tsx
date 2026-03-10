import React, { createContext, useContext, useEffect, useState } from 'react';

export type TransactionType = 'income' | 'expense' | 'debt'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: 'VES' | 'USD' | 'EUR'
  tags: string[]
  description?: string
  date: string
}

interface FinanceContextValue {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  editTransaction: (id: string, patch: Partial<Omit<Transaction, 'id' | 'date'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  exportTransactions: () => void;
  importTransactions: (file: File) => Promise<void>;
}

const STORAGE_KEY = 'finanzapp_transactions_v1';

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const storageGet = async (key: string) => {
    try {
      const win: any = window as any
      const StoragePlugin = win.Capacitor?.Storage || win.Capacitor?.Plugins?.Storage
      if (StoragePlugin && typeof StoragePlugin.get === 'function') return await StoragePlugin.get({ key })
    } catch (e) {}
    return { value: localStorage.getItem(key) }
  }

  const storageSet = async (key: string, value: string) => {
    try {
      const win: any = window as any
      const StoragePlugin = win.Capacitor?.Storage || win.Capacitor?.Plugins?.Storage
      if (StoragePlugin && typeof StoragePlugin.set === 'function') return await StoragePlugin.set({ key, value })
    } catch (e) {}
    localStorage.setItem(key, value)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await storageGet(STORAGE_KEY)
        if (res && res.value) setTransactions(JSON.parse(res.value))
      } catch (e) {
        console.error('Failed to load transactions from storage', e)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const persist = async () => {
      try {
        await storageSet(STORAGE_KEY, JSON.stringify(transactions))
      } catch (e) {
        console.error('Failed to persist transactions to storage', e)
      }
    }
    persist()
  }, [transactions])

  const addTransaction = async (t: Omit<Transaction, 'id' | 'date'>) => {
    const tx: Transaction = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      date: new Date().toISOString(),
      ...t,
    };
    setTransactions((s) => [tx, ...s]);
  };

  const editTransaction = async (id: string, patch: Partial<Omit<Transaction, 'id' | 'date'>>) => {
    setTransactions((s) => s.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((s) => s.filter((t) => t.id !== id));
  };

  const clearAll = async () => {
    setTransactions([]);
  };

  const exportTransactions = () => {
    try {
      const data = JSON.stringify(transactions, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const name = `finanzapp_transactions_${new Date().toISOString().slice(0,10)}.json`
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed', e)
    }
  }

  const importTransactions = async (file: File) => {
    try {
      const txt = await file.text()
      const parsed = JSON.parse(txt)
      if (!Array.isArray(parsed)) throw new Error('Invalid backup format')
      // Basic validation & normalization
      const normalized: Transaction[] = parsed.map((p: any) => ({
        id: p.id ?? (Date.now().toString(36) + Math.random().toString(36).slice(2,8)),
        date: p.date ?? new Date().toISOString(),
        type: p.type ?? 'expense',
        amount: Number(p.amount) || 0,
        currency: p.currency === 'USD' || p.currency === 'EUR' ? p.currency : 'VES',
        tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',').map((s: string) => s.trim()) : []),
        description: p.description ?? ''
      }))
      setTransactions(normalized)
    } catch (e) {
      console.error('Import failed', e)
      throw e
    }
  }

  return (
    <FinanceContext.Provider value={{ transactions, addTransaction, editTransaction, deleteTransaction, clearAll, exportTransactions, importTransactions }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider');
  return ctx;
};

export default FinanceContext;
