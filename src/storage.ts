import type { AppState } from "./types";

const STORAGE_KEY = "finanzapp_state";
const EXCHANGE_RATES_KEY = "finanzapp_exchange_rates";

const DEFAULT_STATE: AppState = {
  transactions: [],
  budgets: {},
  currency: "$",
};

export type StoredExchange = {
  binance: number | null;
  bcv: number | null;
  lastUpdated: number | null;
};

/**
 * Carga el estado de la aplicación desde localStorage.
 * Mantiene compatibilidad con datos existentes cuando faltan campos nuevos.
 * @returns Estado de la aplicación.
 */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        transactions: parsed.transactions || [],
        budgets: parsed.budgets || {},
        currency: parsed.currency || "$",
      };
    }
  } catch (e) {
    console.warn("Error cargando estado:", e);
  }
  return { ...DEFAULT_STATE };
}

/**
 * Guarda el estado de la aplicación en localStorage.
 * @param state Estado de la aplicación.
 */
export function saveState(state: AppState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        transactions: state.transactions,
        budgets: state.budgets,
        currency: state.currency,
      }),
    );
  } catch (e) {
    console.warn("Error guardando estado:", e);
  }
}

export function saveExchangeRates(rates: StoredExchange): void {
  try {
    localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(rates));
  } catch (e) {
    console.warn("Error guardando exchange rates:", e);
  }
}

export function loadExchangeRates(): StoredExchange | null {
  try {
    const raw = localStorage.getItem(EXCHANGE_RATES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      binance: parsed.binance ?? null,
      bcv: parsed.bcv ?? null,
      lastUpdated: parsed.lastUpdated ?? null,
    };
  } catch (e) {
    console.warn("Error cargando exchange rates:", e);
    return null;
  }
}
