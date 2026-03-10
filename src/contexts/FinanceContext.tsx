import React, { createContext, useContext, useEffect, useState } from 'react';

export type TransactionType = 'income' | 'expense' | 'debt';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: 'VES' | 'USD' | 'EUR';
  tags: string[];
  description?: string;
  date: string; // ISO
}

interface FinanceContextValue {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  editTransaction: (id: string, patch: Partial<Omit<Transaction, 'id' | 'date'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const STORAGE_KEY = 'finanzapp_transactions_v1';

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Helper wrappers: try @capacitor/storage dynamically, fall back to localStorage
  const storageGet = async (key: string) => {
      try {
        // If running inside a Capacitor native container and Storage plugin is available
        const win: any = window as any
        if (win && win.Capacitor) {
          // Capacitor v3+ exposes plugins differently; try common variants
          const StoragePlugin = win.Capacitor?.Storage || win.Capacitor?.Plugins?.Storage
          if (StoragePlugin && typeof StoragePlugin.get === 'function') {
            return await StoragePlugin.get({ key })
          }
        }
      } catch (e) {
        // ignore and fallback
      }
      return { value: localStorage.getItem(key) }
  }

  const storageSet = async (key: string, value: string) => {
      try {
        const win: any = window as any
        const StoragePlugin = win.Capacitor?.Storage || win.Capacitor?.Plugins?.Storage
        if (StoragePlugin && typeof StoragePlugin.set === 'function') {
          return await StoragePlugin.set({ key, value })
        }
      } catch (e) {
        // ignore and fallback
      }
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

  return (
    <FinanceContext.Provider value={{ transactions, addTransaction, editTransaction, deleteTransaction, clearAll }}>
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
