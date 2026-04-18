import type { AppState } from './types'

const STORAGE_KEY = 'finanzapp_state'

const DEFAULT_STATE: AppState = {
  transactions: [],
  budgets: {},
  currency: '$',
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        transactions: parsed.transactions || [],
        budgets: parsed.budgets || {},
        currency: parsed.currency || '$',
      }
    }
  } catch (e) {
    console.warn('Error cargando estado:', e)
  }
  return { ...DEFAULT_STATE }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      transactions: state.transactions,
      budgets: state.budgets,
      currency: state.currency,
    }))
  } catch (e) {
    console.warn('Error guardando estado:', e)
  }
}