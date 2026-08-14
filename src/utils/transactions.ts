import { CATEGORIES } from "../data/categories";
import type { Transaction } from "../types";
import { daysInMonth, parseISODate, toISODate } from "./date";

/**
 * Genera un identificador corto único para transacciones.
 * @returns Identificador único.
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Busca una categoría por su identificador.
 * @param id Identificador de categoría.
 * @returns La categoría encontrada o la última por defecto.
 */
export function getCategoryById(id: string) {
  return (
    CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
  );
}

/**
 * Devuelve un saludo según la hora del día.
 * @returns Texto de saludo.
 */
export function getTimeBasedGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 18) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Calcula el monto pendiente de una deuda según su estado.
 * @param transaction Transacción de tipo deuda.
 * @returns Monto pendiente a restar del balance.
 */
export function getDebtOutstandingAmount(transaction: Transaction): number {
  if (transaction.type !== "debt") return 0;
  if (transaction.debtStatus === "paid") return 0;
  const paid = transaction.debtPaidAmount ?? 0;
  return Math.max(transaction.amount - paid, 0);
}

/**
 * Determina si una deuda debe mostrarse en un mes dado.
 * Las deudas pendientes o parciales se muestran desde su mes de creación
 * hasta el mes actual.
 * @param transaction Transacción de deuda.
 * @param month Mes actual (0-11).
 * @param year Año actual.
 * @returns True si la deuda debe aparecer en el mes.
 */
export function isDebtVisibleInMonth(
  transaction: Transaction,
  month: number,
  year: number,
): boolean {
  if (transaction.type !== "debt") return false;
  if (transaction.debtStatus === "paid") {
    const created = parseISODate(transaction.date);
    return created.getMonth() === month && created.getFullYear() === year;
  }
  const created = parseISODate(transaction.date);
  return (
    created.getFullYear() < year ||
    (created.getFullYear() === year && created.getMonth() <= month)
  );
}

/**
 * Genera las ocurrencias de una transacción recurrente en un mes dado.
 * @param transaction Transacción recurrente.
 * @param month Mes objetivo (0-11).
 * @param year Año objetivo.
 * @returns Ocurrencias generadas para ese mes.
 */
export function getRecurringOccurrences(
  transaction: Transaction,
  month: number,
  year: number,
): Transaction[] {
  if (!transaction.isRecurring || !transaction.recurrenceDays?.length)
    return [];

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const startDate = parseISODate(transaction.date);
  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();
  const startDay = startDate.getDate();

  const effectiveStartYear = transaction.recurringBackfill
    ? startYear
    : todayYear;
  const effectiveStartMonth = transaction.recurringBackfill
    ? startMonth
    : todayMonth;
  const effectiveStartDay = transaction.recurringBackfill ? startDay : todayDay;

  if (
    year < effectiveStartYear ||
    (year === effectiveStartYear && month < effectiveStartMonth)
  ) {
    return [];
  }

  const monthIsFuture =
    year > todayYear || (year === todayYear && month > todayMonth);

  return transaction.recurrenceDays
    .filter((day) => day >= 1 && day <= 31)
    .map((day): Transaction | null => {
      const actualDay = Math.min(day, daysInMonth(year, month));
      if (
        year === effectiveStartYear &&
        month === effectiveStartMonth &&
        actualDay < effectiveStartDay
      ) {
        return null;
      }
      if (
        monthIsFuture ||
        (year === todayYear && month === todayMonth && actualDay > todayDay)
      ) {
        return null;
      }
      const date = toISODate(new Date(year, month, actualDay));

      return {
        ...transaction,
        id: `${transaction.id}-${year}-${month}-${actualDay}`,
        date,
        recurringId: transaction.id,
      };
    })
    .filter((item): item is Transaction => item !== null);
}

/**
 * Caché por referencia de transacciones: acelera consultas repetidas del
 * mismo mes/año sin re-calcular O(n) en cada render.
 * Se invalida solo cuando cambia la referencia del array (cualquier mutación
 * de estado genera un array nuevo).
 */
const monthResultsCache = new WeakMap<
  Transaction[],
  Map<string, Transaction[]>
>();

/**
 * Devuelve las transacciones visibles en un mes, expandiendo las recurrentes.
 * Las deudas pagadas con countAsExpense se transforman en gastos de la
 * categoría "Deudas" para que cuenten en los resúmenes de gastos.
 * @param transactions Lista completa de transacciones.
 * @param month Mes seleccionado (0-11).
 * @param year Año seleccionado.
 * @returns Transacciones del mes.
 */
export function getMonthTransactions(
  transactions: Transaction[],
  month: number,
  year: number,
): Transaction[] {
  let byMonth = monthResultsCache.get(transactions);
  if (!byMonth) {
    byMonth = new Map();
    monthResultsCache.set(transactions, byMonth);
  }
  const key = `${year}-${month}`;
  const cached = byMonth.get(key);
  if (cached) return cached;
  const result = computeMonthTransactions(transactions, month, year);
  byMonth.set(key, result);
  return result;
}

function computeMonthTransactions(
  transactions: Transaction[],
  month: number,
  year: number,
): Transaction[] {
  return transactions.flatMap((t) => {
    if (t.isRecurring && t.type !== "debt") {
      return getRecurringOccurrences(t, month, year);
    }

    if (t.type === "debt" && t.debtStatus === "paid" && t.countAsExpense) {
      const paidDate = parseISODate(t.debtPaidDate ?? t.date);
      if (paidDate.getMonth() !== month || paidDate.getFullYear() !== year) {
        return [];
      }
      return [
        {
          ...t,
          type: "expense" as const,
          category: "debt_paid",
          date: toISODate(paidDate),
          isRecurring: false,
          recurrenceDays: undefined,
          recurringBackfill: undefined,
        },
      ];
    }

    const date = parseISODate(t.date);
    const matchesMonth =
      date.getMonth() === month && date.getFullYear() === year;
    return matchesMonth ? [t] : [];
  });
}

/**
 * Devuelve las transacciones que aún no se han ejecutado.
 * Para cada transacción recurrente incluye solo su próximo evento
 * (la siguiente fecha de recurrencia posterior a hoy), y para las
 * manuales incluye todas las que tengan fecha futura.
 * @param transactions Lista completa de transacciones.
 * @returns Transacciones con fecha posterior a hoy.
 */
export function getFutureTransactions(
  transactions: Transaction[],
): Transaction[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const result: Transaction[] = [];

  transactions.forEach((t) => {
    if (t.isRecurring && t.type !== "debt") {
      if (!t.recurrenceDays?.length) return;

      const startDate = parseISODate(t.date);
      const effectiveStartYear = t.recurringBackfill
        ? startDate.getFullYear()
        : todayYear;
      const effectiveStartMonth = t.recurringBackfill
        ? startDate.getMonth()
        : todayMonth;

      const MAX_MONTHS = 120;
      for (let m = 0; m < MAX_MONTHS; m++) {
        const monthDate = new Date(todayYear, todayMonth + m, 1);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        if (
          year < effectiveStartYear ||
          (year === effectiveStartYear && month < effectiveStartMonth)
        ) {
          continue;
        }

        const candidates = t.recurrenceDays
          .filter((day) => day >= 1 && day <= 31)
          .map((day) => Math.min(day, daysInMonth(year, month)))
          .sort((a, b) => a - b);

        for (const actualDay of candidates) {
          const eventDate = new Date(year, month, actualDay);
          if (eventDate > today) {
            result.push({
              ...t,
              id: `${t.id}-${year}-${month}-${actualDay}`,
              date: toISODate(eventDate),
              recurringId: t.id,
            });
            return;
          }
        }
      }
      return;
    }

    if (parseISODate(t.date) > today) result.push(t);
  });

  return result;
}

/**
 * Devuelve las transacciones de un mes incluyendo deudas carry-forward.
 * @param transactions Lista completa de transacciones.
 * @param month Mes seleccionado (0-11).
 * @param year Año seleccionado.
 * @returns Transacciones visibles en la tabla del mes.
 */
export function getMonthTransactionsWithDebtCarry(
  transactions: Transaction[],
  month: number,
  year: number,
): Transaction[] {
  const monthTransactions = getMonthTransactions(
    transactions,
    month,
    year,
  ).filter((t) => t.type !== "debt");

  const visibleDebts = transactions.filter((t) => {
    if (t.type !== "debt") return false;
    if (t.debtStatus === "paid" && t.countAsExpense) return false;
    if (t.isRecurring) {
      return getRecurringOccurrences(t, month, year).length > 0;
    }
    return isDebtVisibleInMonth(t, month, year);
  });

  return [...monthTransactions, ...visibleDebts];
}

/**
 * Devuelve todas las deudas pendientes o parciales visibles en un mes.
 * @param transactions Lista completa de transacciones.
 * @param month Mes seleccionado (0-11).
 * @param year Año seleccionado.
 * @returns Deudas no pagadas visibles en ese mes.
 */
export function getPendingDebtsForMonth(
  transactions: Transaction[],
  month: number,
  year: number,
): Transaction[] {
  return transactions.filter(
    (t) =>
      t.type === "debt" &&
      t.debtStatus !== "paid" &&
      isDebtVisibleInMonth(t, month, year),
  );
}

/**
 * Calcula el total de deuda activa (pendiente o parcial) en un mes.
 * @param transactions Lista completa de transacciones.
 * @param month Mes seleccionado (0-11).
 * @param year Año seleccionado.
 * @returns Total de deuda activa para ese mes.
 */
export function calculateMonthDebtAmount(
  transactions: Transaction[],
  month: number,
  year: number,
): number {
  return getPendingDebtsForMonth(transactions, month, year).reduce(
    (sum, tx) => sum + getDebtOutstandingAmount(tx),
    0,
  );
}

function monthKey(month: number, year: number) {
  return year * 100 + month;
}

function monthIncrement(month: number, year: number): [number, number] {
  if (month === 11) return [0, year + 1];
  return [month + 1, year];
}

function monthDecrement(month: number, year: number): [number, number] {
  if (month === 0) return [11, year - 1];
  return [month - 1, year];
}

function getEarliestTransactionMonth(
  transactions: Transaction[],
): [number, number] {
  if (transactions.length === 0) return [0, 0];
  const sorted = [...transactions].sort(
    (a, b) =>
      parseISODate(a.date).getTime() - parseISODate(b.date).getTime(),
  );
  const earliest = parseISODate(sorted[0].date);
  return [earliest.getMonth(), earliest.getFullYear()];
}

/**
 * Calcula el saldo acumulado hasta el mes anterior al mes seleccionado.
 * @param transactions Lista completa de transacciones.
 * @param month Mes actual (0-11).
 * @param year Año actual.
 * @returns Saldo final del mes anterior.
 */
export function calculatePreviousBalance(
  transactions: Transaction[],
  month: number,
  year: number,
): number {
  const [startMonth, startYear] = getEarliestTransactionMonth(transactions);
  if (transactions.length === 0) return 0;

  const [endMonth, endYear] = monthDecrement(month, year);
  let currentMonth = startMonth;
  let currentYear = startYear;
  let balance = 0;

  while (monthKey(currentMonth, currentYear) <= monthKey(endMonth, endYear)) {
    const monthTransactions = getMonthTransactions(
      transactions,
      currentMonth,
      currentYear,
    ).filter((t) => t.type !== "debt");

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const debtAmount = calculateMonthDebtAmount(
      transactions,
      currentMonth,
      currentYear,
    );

    balance += income - expense - debtAmount;
    [currentMonth, currentYear] = monthIncrement(currentMonth, currentYear);
  }

  return balance;
}
