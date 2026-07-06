import { CATEGORIES } from "../data/categories";
import type { Category, Transaction } from "../types";

/**
 * Formatea un monto numérico con la moneda actual.
 * @param amount Monto a formatear.
 * @param currency Símbolo de moneda.
 * @returns Texto con moneda y dos decimales.
 */
export function formatMoney(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  return (
    currency +
    abs.toLocaleString("es", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * Busca una categoría por su identificador.
 * @param id Identificador de categoría.
 * @returns La categoría encontrada o la última por defecto.
 */
export function getCatById(id: string) {
  return (
    CATEGORIES.find((c: Category) => c.id === id) ||
    CATEGORIES[CATEGORIES.length - 1]
  );
}

/**
 * Genera un identificador corto único para transacciones.
 * @returns Identificador único.
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Devuelve un saludo según la hora del día.
 * @returns Texto de saludo.
 */
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 18) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Calcula la cantidad de días en un mes específico.
 * @param year Año.
 * @param month Mes (0-11).
 * @returns Número de días del mes.
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
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
    const created = new Date(transaction.date);
    return created.getMonth() === month && created.getFullYear() === year;
  }
  const created = new Date(transaction.date);
  return (
    created.getFullYear() < year ||
    (created.getFullYear() === year && created.getMonth() <= month)
  );
}

/**
 * Filtra las transacciones de un mes incluyendo deudas carry-forward.
 * @param transactions Lista completa de transacciones.
 * @param month Mes seleccionado.
 * @param year Año seleccionado.
 * @returns Transacciones visibles en la tabla del mes.
 */
export function getRecurringOccurrences(
  transaction: Transaction,
  month: number,
  year: number,
): Transaction[] {
  if (!transaction.isRecurring || !transaction.recurrenceDays?.length)
    return [];

  const startDate = new Date(transaction.date);
  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();
  const startDay = startDate.getDate();

  if (year < startYear || (year === startYear && month < startMonth)) {
    return [];
  }

  return transaction.recurrenceDays
    .filter((day) => day >= 1 && day <= 31)
    .map((day) => {
      const actualDay = Math.min(day, daysInMonth(year, month));
      if (year === startYear && month === startMonth && actualDay < startDay) {
        return null;
      }
      const date = new Date(year, month, actualDay).toISOString().split("T")[0];

      return {
        ...transaction,
        id: `${transaction.id}-${year}-${month}-${actualDay}`,
        date,
        recurringId: transaction.id,
      };
    })
    .filter((item): item is Transaction => item !== null);
}

export function getMonthTransactions(
  transactions: Transaction[],
  month: number,
  year: number,
): Transaction[] {
  return transactions.flatMap((t) => {
    if (t.isRecurring && t.type !== "debt") {
      return getRecurringOccurrences(t, month, year);
    }

    const date = new Date(t.date);
    const matchesMonth =
      date.getMonth() === month && date.getFullYear() === year;
    return matchesMonth ? [t] : [];
  });
}

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
 * @param month Mes seleccionado.
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
 * @param month Mes seleccionado.
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
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const earliest = new Date(sorted[0].date);
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
