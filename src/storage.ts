import type { AppState } from "./types";

const STORAGE_KEY = "finanzapp_state";

const DEFAULT_STATE: AppState = {
  transactions: [],
  budgets: {},
  currency: "$",
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
