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
  language: "es",
  pinHash: null,
  useBiometrics: false,
  goals: [],
  lastExportAt: null,
  hasSeenTutorial: false,
};

/**
 * Carga el estado de la aplicación desde localStorage.
 * Mantiene compatibilidad con datos existentes cuando faltan campos nuevos.
 * @returns Estado de la aplicación.
 */
export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        transactions: parsed.transactions || [],
        budgets: parsed.budgets || {},
        currency: parsed.currency || "$",
        showCalculator: parsed.showCalculator ?? true,
        showEUR: parsed.showEUR ?? false,
        showCustomRate: parsed.showCustomRate ?? false,
        customRate:
          typeof parsed.customRate === "number" && parsed.customRate > 0
            ? parsed.customRate
            : null,
        language: parsed.language === "en" ? "en" : "es",
        pinHash:
          typeof parsed.pinHash === "string" && parsed.pinHash
            ? parsed.pinHash
            : null,
        useBiometrics: parsed.useBiometrics ?? false,
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        lastExportAt:
          typeof parsed.lastExportAt === "number" ? parsed.lastExportAt : null,
        hasSeenTutorial: parsed.hasSeenTutorial ?? false,
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
