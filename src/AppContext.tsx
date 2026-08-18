import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import type {
  Transaction,
  PersistedState,
  ToastState,
  ConfirmState,
  PageId,
  FilterType,
  SavingsGoal,
} from "./types";
import {
  loadState,
  saveState,
  loadExchangeRates,
  saveExchangeRates,
} from "./storage";
import {
  generateId,
  getMonthTransactions as getMonthTransactionsForMonth,
} from "./utils/transactions";
import type { ExchangeRates } from "./utils/exchangeRates";
import { fetchAllRates } from "./utils/exchangeRates";
import { setLanguage as setI18nLanguage, t } from "./i18n";
import {
  notifyRateChanges,
  notifyBudgetAlerts,
  requestNotificationPermission,
  scheduleDebtReminders,
  scheduleBackupReminder,
  scheduleMonthlySummary,
} from "./utils/notifications";

interface AppContextValue extends PersistedState {
  currentPage: PageId;
  currentMonth: number;
  currentYear: number;
  currentTypeFilter: FilterType;
  currentCategoryFilter: string;
  toast: ToastState;
  confirm: ConfirmState;
  exchangeRates: ExchangeRates;
  navigateTo: (page: PageId) => void;
  addTransaction: (data: Omit<Transaction, "id" | "createdAt">) => void;
  updateTransaction: (
    id: string,
    data: Omit<Transaction, "id" | "createdAt">,
  ) => void;
  deleteTransaction: (id: string) => void;
  setBudgets: (budgets: Record<string, number>) => void;
  setCurrency: (currency: string) => void;
  setShowCalculator: (show: boolean) => void;
  setShowEUR: (show: boolean) => void;
  setShowCustomRate: (show: boolean) => void;
  setCustomRate: (rate: number | null) => void;
  setLanguage: (language: "es" | "en") => void;
  pinHash: string | null;
  useBiometrics: boolean;
  goals: SavingsGoal[];
  lastExportAt: number | null;
  hasSeenTutorial: boolean;
  locked: boolean;
  setPinHash: (hash: string | null) => void;
  setUseBiometrics: (use: boolean) => void;
  setGoals: (goals: SavingsGoal[]) => void;
  setLastExportAt: (at: number | null) => void;
  setHasSeenTutorial: (seen: boolean) => void;
  unlock: () => void;
  changeMonth: (delta: number) => void;
  setFilter: (filter: FilterType) => void;
  setCategoryFilter: (filter: string) => void;
  getMonthTransactions: (month: number, year: number) => Transaction[];
  showToast: (message: string, icon?: string, color?: string) => void;
  closeToast: () => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmLabel?: string;
      cancelLabel?: string;
      onCancel?: () => void;
    },
  ) => void;
  closeConfirm: () => void;
  txnModalOpen: boolean;
  txnModalEditingId: string | null;
  openTransactionModal: (editingId?: string | null) => void;
  closeTransactionModal: () => void;
  importState: (state: PersistedState) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const RATES_REFRESH_INTERVAL = 3 * 60 * 1000;
const RATES_MIN_FETCH_GAP = 60 * 1000;
const LOCK_TIMEOUT_MS = 12 * 60 * 60 * 1000;

/**
 * Proveedor principal de contexto de la aplicación.
 * Maneja estado global, transacciones, configuración y navegación.
 * @param children Componentes hijos que consumen el contexto.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [savedState] = useState(loadState);
  const [transactions, setTransactions] = useState<Transaction[]>(
    savedState.transactions,
  );
  const [budgets, setBudgetsState] = useState<Record<string, number>>(
    savedState.budgets,
  );
  const [currency, setCurrencyState] = useState(savedState.currency);
  const [showCalculator, setShowCalculatorState] = useState(
    savedState.showCalculator,
  );
  const [showEUR, setShowEURState] = useState(savedState.showEUR);
  const [showCustomRate, setShowCustomRateState] = useState(
    savedState.showCustomRate,
  );
  const [customRate, setCustomRateState] = useState<number | null>(
    savedState.customRate,
  );
  const [language, setLanguageState] = useState<"es" | "en">(
    savedState.language,
  );
  const [pinHash, setPinHashState] = useState<string | null>(
    savedState.pinHash,
  );
  const [useBiometrics, setUseBiometricsState] = useState(
    savedState.useBiometrics,
  );
  const [goals, setGoalsState] = useState<SavingsGoal[]>(savedState.goals);
  const [lastExportAt, setLastExportAtState] = useState<number | null>(
    savedState.lastExportAt,
  );
  const [hasSeenTutorial, setHasSeenTutorialState] = useState(
    savedState.hasSeenTutorial,
  );
  const [locked, setLocked] = useState(savedState.pinHash !== null);
  const backgroundedAtRef = useRef<number | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>("home");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentTypeFilter, setCurrentTypeFilter] =
    useState<FilterType>("all");
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState("all");
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    icon: "fa-check-circle",
    color: "var(--accent)",
  });
  const [confirm, setConfirm] = useState<ConfirmState>({
    visible: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [txnModalEditingId, setTxnModalEditingId] = useState<string | null>(
    null,
  );
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(() => {
    const cached = loadExchangeRates();
    if (
      cached &&
      (cached.parallel !== null || cached.bcv !== null || cached.eur !== null)
    ) {
      return cached;
    }
    return { parallel: null, bcv: null, eur: null, lastUpdated: null };
  });
  const previousRatesRef = useRef<ExchangeRates | null>(exchangeRates);
  const lastRatesFetchRef = useRef(0);
  const loadRatesRef = useRef<() => Promise<void>>(async () => {});
  const latestStateRef = useRef<{
    transactions: Transaction[];
    budgets: Record<string, number>;
    currency: string;
    showCalculator: boolean;
    showEUR: boolean;
    showCustomRate: boolean;
    customRate: number | null;
    language: "es" | "en";
    pinHash: string | null;
    useBiometrics: boolean;
    goals: SavingsGoal[];
    lastExportAt: number | null;
    hasSeenTutorial: boolean;
  }>({
    transactions,
    budgets,
    currency,
    showCalculator,
    showEUR,
    showCustomRate,
    customRate,
    language,
    pinHash,
    useBiometrics,
    goals,
    lastExportAt,
    hasSeenTutorial,
  });

  useEffect(() => {
    setI18nLanguage(language);
  }, [language]);

  useEffect(() => {
    const state = {
      transactions,
      budgets,
      currency,
      showCalculator,
      showEUR,
      showCustomRate,
      customRate,
      language,
      pinHash,
      useBiometrics,
      goals,
      lastExportAt,
      hasSeenTutorial,
    };
    latestStateRef.current = state;
    const timer = setTimeout(() => saveState(state), 1000);
    return () => clearTimeout(timer);
  }, [transactions, budgets, currency, showCalculator, showEUR, showCustomRate, customRate, language, pinHash, useBiometrics, goals, lastExportAt, hasSeenTutorial]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const granted = await requestNotificationPermission();
      if (!granted || cancelled) return;
      await scheduleDebtReminders(transactions);
      await notifyBudgetAlerts(transactions, budgets, currency);
      await scheduleBackupReminder(lastExportAt);
      await scheduleMonthlySummary(transactions, currency);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [transactions, budgets, currency, lastExportAt]);

  /**
   * Obtiene las transacciones del mes especificado.
   * @param month Mes seleccionado (0-11).
   * @param year Año seleccionado.
   * @returns Transacciones con fecha dentro del mes.
   */
  const getMonthTransactions = useCallback(
    (month: number, year: number) =>
      getMonthTransactionsForMonth(transactions, month, year),
    [transactions],
  );

  /**
   * Agrega una nueva transacción al estado.
   * @param data Datos de la transacción sin id ni createdAt.
   */
  const addTransaction = useCallback(
    (data: Omit<Transaction, "id" | "createdAt">) => {
      setTransactions((prev) => [
        ...prev,
        { ...data, id: generateId(), createdAt: Date.now() },
      ]);
    },
    [],
  );

  /**
   * Actualiza una transacción existente.
   * @param id Id de la transacción.
   * @param data Nuevos datos de la transacción.
   */
  const updateTransaction = useCallback(
    (id: string, data: Omit<Transaction, "id" | "createdAt">) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
      );
    },
    [],
  );

  /**
   * Elimina una transacción por su id.
   * @param id Id de la transacción a eliminar.
   */
  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Reemplaza el objeto de presupuestos.
   * @param b Nuevo diccionario de presupuestos.
   */
  const setBudgets = useCallback((b: Record<string, number>) => {
    setBudgetsState(b);
  }, []);

  /**
   * Cambia la moneda actual.
   * @param c Símbolo de moneda.
   */
  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c);
  }, []);

  const setShowCalculator = useCallback((show: boolean) => {
    setShowCalculatorState(show);
  }, []);

  const setShowEUR = useCallback((show: boolean) => {
    setShowEURState(show);
  }, []);

  const setShowCustomRate = useCallback((show: boolean) => {
    setShowCustomRateState(show);
  }, []);

  const setCustomRate = useCallback((rate: number | null) => {
    setCustomRateState(rate);
  }, []);

  const setLanguage = useCallback((lang: "es" | "en") => {
    setLanguageState(lang);
  }, []);

  const setPinHash = useCallback((hash: string | null) => {
    setPinHashState(hash);
  }, []);

  const setUseBiometrics = useCallback((use: boolean) => {
    setUseBiometricsState(use);
  }, []);

  const setGoals = useCallback((g: SavingsGoal[]) => {
    setGoalsState(g);
  }, []);

  const setLastExportAt = useCallback((at: number | null) => {
    setLastExportAtState(at);
  }, []);

  const setHasSeenTutorial = useCallback((seen: boolean) => {
    setHasSeenTutorialState(seen);
  }, []);

  const unlock = useCallback(() => {
    setLocked(false);
  }, []);

  /**
   * Avanza o retrocede el mes actual.
   * @param delta Incremento de meses (+1 o -1).
   */
  const changeMonth = useCallback(
    (delta: number) => {
      setCurrentMonth((prev) => {
        let m = prev + delta;
        let y = currentYear;
        if (m > 11) {
          m = 0;
          y++;
        }
        if (m < 0) {
          m = 11;
          y--;
        }
        setCurrentYear(y);
        return m;
      });
    },
    [currentYear],
  );

  /**
   * Navega a una página principal.
   * @param page Identificador de página.
   */
  const navigateTo = useCallback((page: PageId) => {
    setCurrentPage(page);
    const target = `#/${page}`;
    if (window.location.hash !== target) {
      window.location.hash = target;
    }
  }, []);

  /**
   * Establece el filtro de tipo de transacción.
   * @param f Filtro seleccionado.
   */
  const setFilter = useCallback(
    (f: FilterType) => setCurrentTypeFilter(f),
    [],
  );

  /**
   * Establece el filtro de categoría.
   * @param f Identificador de categoría.
   */
  const setCategoryFilter = useCallback(
    (f: string) => setCurrentCategoryFilter(f),
    [],
  );

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Muestra un toast temporal en pantalla.
   * @param message Mensaje a mostrar.
   * @param icon Icono opcional.
   * @param color Color del toast.
   */
  const showToast = useCallback(
    (message: string, icon = "fa-check-circle", color = "var(--accent)") => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ visible: true, message, icon, color });
      toastTimerRef.current = setTimeout(
        () => setToast((prev) => ({ ...prev, visible: false })),
        2500,
      );
    },
    [],
  );

  /**
   * Oculta el toast manualmente.
   */
  const closeToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * Muestra un diálogo de confirmación.
   * @param title Título del diálogo.
   * @param message Mensaje de confirmación.
   * @param onConfirm Acción a ejecutar si se confirma.
   */
  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      options?: {
        confirmLabel?: string;
        cancelLabel?: string;
        onCancel?: () => void;
      },
    ) => {
      setConfirm({
        visible: true,
        title,
        message,
        onConfirm,
        confirmLabel: options?.confirmLabel,
        cancelLabel: options?.cancelLabel,
        onCancel: options?.onCancel ?? null,
      });
    },
    [],
  );

  /**
   * Cierra el diálogo de confirmación.
   */
  const closeConfirm = useCallback(() => {
    setConfirm({
      visible: false,
      title: "",
      message: "",
      onConfirm: null,
      onCancel: null,
    });
  }, []);

  /**
   * Abre el modal de transacciones desde cualquier vista.
   * @param editingId Id de la transacción a editar (null para crear nueva).
   */
  const openTransactionModal = useCallback((editingId: string | null = null) => {
    setTxnModalEditingId(editingId);
    setTxnModalOpen(true);
  }, []);

  /**
   * Cierra el modal de transacciones.
   */
  const closeTransactionModal = useCallback(() => {
    setTxnModalOpen(false);
    setTxnModalEditingId(null);
  }, []);

  /**
   * Reemplaza el estado completo de la aplicación.
   * @param newState Nuevo estado de la aplicación.
   */
  const importState = useCallback((newState: PersistedState) => {
    setTransactions(newState.transactions);
    setBudgetsState(newState.budgets);
    setCurrencyState(newState.currency);
    setShowCalculatorState(newState.showCalculator);
    setShowEURState(newState.showEUR);
    setShowCustomRateState(newState.showCustomRate ?? false);
    setCustomRateState(newState.customRate ?? null);
    setLanguageState(newState.language === "en" ? "en" : "es");
    setPinHashState(newState.pinHash ?? null);
    setUseBiometricsState(newState.useBiometrics ?? false);
    setGoalsState(Array.isArray(newState.goals) ? newState.goals : []);
    setLastExportAtState(
      typeof newState.lastExportAt === "number" ? newState.lastExportAt : null,
    );
    setHasSeenTutorialState(newState.hasSeenTutorial ?? false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const loadRates = async (force = false) => {
      if (
        !force &&
        Date.now() - lastRatesFetchRef.current < RATES_MIN_FETCH_GAP
      )
        return;
      lastRatesFetchRef.current = Date.now();
      console.log("🔄 Refreshing exchange rates...");
      try {
        const rates = await fetchAllRates();
        if (cancelled) return;
        const cached = loadExchangeRates();
        const merged = {
          parallel: rates.parallel || cached?.parallel || null,
          bcv: rates.bcv || cached?.bcv || null,
          eur: rates.eur || cached?.eur || null,
          lastUpdated: rates.lastUpdated,
          fromCache:
            (rates.parallel == null && cached?.parallel != null) ||
            (rates.bcv == null && cached?.bcv != null) ||
            (rates.eur == null && cached?.eur != null),
        };
        console.log("✅ Exchange rates updated:", merged);
        setExchangeRates(merged);
        saveExchangeRates(merged);
        notifyRateChanges(previousRatesRef.current, merged);
        previousRatesRef.current = merged;
        if (merged.fromCache) {
          showToast(
            t("toast.rates_cache"),
            "fa-info-circle",
            "var(--warning)",
          );
        }
      } catch (error) {
        if (cancelled) return;
        console.error("❌ Error refreshing exchange rates:", error);
        const cached = loadExchangeRates();
        if (
          cached &&
          (cached.parallel !== null ||
            cached.bcv !== null ||
            cached.eur !== null)
        ) {
          setExchangeRates(cached);
          showToast(
            t("toast.rates_cached_using"),
            "fa-info-circle",
            "var(--warning)",
          );
        } else {
          showToast(
            t("toast.rates_error"),
            "fa-exclamation-triangle",
            "var(--danger)",
          );
        }
      }
    };

    loadRatesRef.current = loadRates;
    loadRates(true);
    interval = setInterval(loadRates, RATES_REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [showToast]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        loadRatesRef.current();
        if (
          backgroundedAtRef.current !== null &&
          Date.now() - backgroundedAtRef.current >= LOCK_TIMEOUT_MS
        ) {
          setLocked(latestStateRef.current.pinHash !== null);
        }
        backgroundedAtRef.current = null;
      } else {
        saveState(latestStateRef.current);
        backgroundedAtRef.current = Date.now();
      }
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const flush = () => saveState(latestStateRef.current);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (notification) => {
        const debtId = notification.notification.extra?.debtId as
          | string
          | undefined;
        if (!debtId) return;
        navigateTo("home");
        openTransactionModal(debtId);
      },
    );
    return () => {
      listener.then((l) => l.remove());
    };
  }, [navigateTo, openTransactionModal]);

  const value = useMemo<AppContextValue>(
    () => ({
      transactions,
      budgets,
      currency,
      showCalculator,
      showEUR,
      showCustomRate,
      customRate,
      language,
      pinHash,
      useBiometrics,
      goals,
      lastExportAt,
      hasSeenTutorial,
      locked,
      currentPage,
      currentMonth,
      currentYear,
      currentTypeFilter,
      currentCategoryFilter,
      toast,
      confirm,
      txnModalOpen,
      txnModalEditingId,
      navigateTo,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setBudgets,
      setCurrency,
      setShowCalculator,
      setShowEUR,
      setShowCustomRate,
      setCustomRate,
      setLanguage,
      setPinHash,
      setUseBiometrics,
      setGoals,
      setLastExportAt,
      setHasSeenTutorial,
      unlock,
      changeMonth,
      setFilter,
      setCategoryFilter,
      getMonthTransactions,
      showToast,
      closeToast,
      showConfirm,
      closeConfirm,
      openTransactionModal,
      closeTransactionModal,
      importState,
      exchangeRates,
    }),
    [
      transactions,
      budgets,
      currency,
      showCalculator,
      showEUR,
      showCustomRate,
      customRate,
      currentPage,
      currentMonth,
      currentYear,
      currentTypeFilter,
      currentCategoryFilter,
      toast,
      confirm,
      txnModalOpen,
      txnModalEditingId,
      navigateTo,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setBudgets,
      setCurrency,
      setShowCalculator,
      setShowEUR,
      setShowCustomRate,
      setCustomRate,
      setLanguage,
      setPinHash,
      setUseBiometrics,
      setGoals,
      setLastExportAt,
      setHasSeenTutorial,
      unlock,
      locked,
      pinHash,
      useBiometrics,
      goals,
      lastExportAt,
      hasSeenTutorial,
      changeMonth,
      setFilter,
      setCategoryFilter,
      getMonthTransactions,
      showToast,
      closeToast,
      showConfirm,
      closeConfirm,
      openTransactionModal,
      closeTransactionModal,
      importState,
      exchangeRates,
      language,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook para acceder al contexto global de la aplicación.
 * @returns Valor del contexto de la app.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
