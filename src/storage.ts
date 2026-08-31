import type { PersistedState } from "./types";
import type { ExchangeRates } from "./utils/exchangeRates";

const STORAGE_KEY = "finanzapp_state";
const EXCHANGE_RATES_KEY = "finanzapp_exchange_rates";

const DEFAULT_STATE: PersistedState = {
  transactions: [],
  budgets: {},
  currency: "$",
  showCalculator: true,
  showEUR: false,
  showCustomRate: false,
  customRate: null,
  equivalentRate: "bcv",
  language: "es",
  pinHash: null,
  useBiometrics: false,
  goals: [],
  lastExportAt: null,
  hasSeenTutorial: false,
};

/**
 * Normaliza un objeto arbitrario a un PersistedState válido,
 * aplicando valores por defecto y validaciones por campo.
 */
export function normalizePersistedState(parsed: unknown): PersistedState {
  const p = (parsed ?? {}) as Record<string, unknown>;
  return {
    transactions: Array.isArray(p.transactions) ? p.transactions : [],
    budgets:
      typeof p.budgets === "object" && p.budgets !== null
        ? (p.budgets as PersistedState["budgets"])
        : {},
    currency: typeof p.currency === "string" && p.currency ? p.currency : "$",
    showCalculator: typeof p.showCalculator === "boolean" ? p.showCalculator : true,
    showEUR: p.showEUR === true,
    showCustomRate: p.showCustomRate === true,
    customRate:
      typeof p.customRate === "number" && p.customRate > 0 ? p.customRate : null,
    equivalentRate:
      p.equivalentRate === "parallel" || p.equivalentRate === "custom"
        ? p.equivalentRate
        : "bcv",
    language: p.language === "en" ? "en" : "es",
    pinHash:
      typeof p.pinHash === "string" && p.pinHash ? p.pinHash : null,
    useBiometrics: p.useBiometrics === true,
    goals: Array.isArray(p.goals) ? p.goals : [],
    lastExportAt: typeof p.lastExportAt === "number" ? p.lastExportAt : null,
    hasSeenTutorial: p.hasSeenTutorial === true,
  };
}

/**
 * Carga el estado de la aplicación desde localStorage.
 * Mantiene compatibilidad con datos existentes cuando faltan campos nuevos.
 * @returns Estado de la aplicación.
 */
export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizePersistedState(JSON.parse(raw));
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
export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        transactions: state.transactions,
        budgets: state.budgets,
        currency: state.currency,
        showCalculator: state.showCalculator,
        showEUR: state.showEUR,
        showCustomRate: state.showCustomRate,
        customRate: state.customRate,
        equivalentRate: state.equivalentRate,
        language: state.language,
        pinHash: state.pinHash,
        useBiometrics: state.useBiometrics,
        goals: state.goals,
        lastExportAt: state.lastExportAt,
        hasSeenTutorial: state.hasSeenTutorial,
      }),
    );
  } catch (e) {
    console.warn("Error guardando estado:", e);
  }
}

export function saveExchangeRates(rates: ExchangeRates): void {
  try {
    localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(rates));
  } catch (e) {
    console.warn("Error guardando exchange rates:", e);
  }
}

export function loadExchangeRates(): ExchangeRates | null {
  try {
    const raw = localStorage.getItem(EXCHANGE_RATES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      parallel: parsed.parallel || parsed.binance || null,
      bcv: parsed.bcv || null,
      eur: parsed.eur || null,
      lastUpdated: parsed.lastUpdated ?? null,
      fromCache: true,
    };
  } catch (e) {
    console.warn("Error cargando exchange rates:", e);
    return null;
  }
}
