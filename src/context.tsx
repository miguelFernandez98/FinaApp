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
import type {
  Transaction,
  AppState,
  ToastState,
  ConfirmState,
  PageId,
  FilterType,
} from "./types";
import {
  loadState,
  saveState,
  loadExchangeRates,
  saveExchangeRates,
} from "./storage";
import { generateId } from "./utils/helpers";
import type { ExchangeRates } from "./utils/exchangeRates";
import { fetchAllRates } from "./utils/exchangeRates";
import { getMonthTransactions as getMonthTransactionsForMonth } from "./utils/helpers";

interface AppContextValue extends AppState {
  currentPage: PageId;
  currentMonth: number;
  currentYear: number;
  currentFilter: FilterType;
  currentCatFilter: string;
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
  changeMonth: (delta: number) => void;
  setFilter: (filter: FilterType) => void;
  setCatFilter: (filter: string) => void;
  getMonthTransactions: (month: number, year: number) => Transaction[];
  showToast: (message: string, icon?: string, color?: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
  replaceAllData: (state: AppState) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

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
  const [currentPage, setCurrentPage] = useState<PageId>("home");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentFilter, setCurrentFilter] = useState<FilterType>("all");
  const [currentCatFilter, setCurrentCatFilter] = useState("all");
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
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(() => {
    const cached = loadExchangeRates();
    if (cached && (cached.binance !== null || cached.bcv !== null)) {
      return cached;
    }
    return { binance: null, bcv: null, lastUpdated: null };
  });

  useEffect(() => {
    saveState({ transactions, budgets, currency });
  }, [transactions, budgets, currency]);

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
  }, []);

  /**
   * Establece el filtro de tipo de transacción.
   * @param f Filtro seleccionado.
   */
  const setFilter = useCallback((f: FilterType) => setCurrentFilter(f), []);

  /**
   * Establece el filtro de categoría.
   * @param f Identificador de categoría.
   */
  const setCatFilter = useCallback((f: string) => setCurrentCatFilter(f), []);

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
   * Muestra un diálogo de confirmación.
   * @param title Título del diálogo.
   * @param message Mensaje de confirmación.
   * @param onConfirm Acción a ejecutar si se confirma.
   */
  const showConfirm = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      setConfirm({ visible: true, title, message, onConfirm });
    },
    [],
  );

  /**
   * Cierra el diálogo de confirmación.
   */
  const closeConfirm = useCallback(() => {
    setConfirm({ visible: false, title: "", message: "", onConfirm: null });
  }, []);

  /**
   * Reemplaza el estado completo de la aplicación.
   * @param newState Nuevo estado de la aplicación.
   */
  const replaceAllData = useCallback((newState: AppState) => {
    setTransactions(newState.transactions);
    setBudgetsState(newState.budgets);
    setCurrencyState(newState.currency);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRates = async () => {
      console.log("🔄 Refreshing exchange rates...");
      try {
        const rates = await fetchAllRates();
        if (cancelled) return;
        console.log("✅ Exchange rates updated:", rates);
        setExchangeRates(rates);
        saveExchangeRates(rates);
      } catch (error) {
        if (cancelled) return;
        console.error("❌ Error refreshing exchange rates:", error);
        const cached = loadExchangeRates();
        if (cached && (cached.binance !== null || cached.bcv !== null)) {
          setExchangeRates(cached);
          showToast(
            "Usando tasas en caché (sin conexión)",
            "fa-info-circle",
            "var(--warning)",
          );
        } else {
          showToast(
            "No se pudieron cargar tasas (sin conexión ni caché)",
            "fa-exclamation-triangle",
            "var(--danger)",
          );
        }
      }
    };

    loadRates();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const value = useMemo<AppContextValue>(
    () => ({
      transactions,
      budgets,
      currency,
      currentPage,
      currentMonth,
      currentYear,
      currentFilter,
      currentCatFilter,
      toast,
      confirm,
      navigateTo,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setBudgets,
      setCurrency,
      changeMonth,
      setFilter,
      setCatFilter,
      getMonthTransactions,
      showToast,
      showConfirm,
      closeConfirm,
      replaceAllData,
      exchangeRates,
    }),
    [
      transactions,
      budgets,
      currency,
      currentPage,
      currentMonth,
      currentYear,
      currentFilter,
      currentCatFilter,
      toast,
      confirm,
      navigateTo,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setBudgets,
      setCurrency,
      changeMonth,
      setFilter,
      setCatFilter,
      getMonthTransactions,
      showToast,
      showConfirm,
      closeConfirm,
      replaceAllData,
      exchangeRates,
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
