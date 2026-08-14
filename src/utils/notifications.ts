import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Transaction } from "../types";
import type { ExchangeRates } from "./exchangeRates";
import { getCategoryById } from "./transactions";
import { formatMoney } from "./format";

const RATE_CHANGE_THRESHOLD = 0.01;
const RATE_NOTIFY_COOLDOWN_MS = 30 * 60 * 1000;
const DEBT_WARNING_DAYS = 7;
const DEBT_MID_DAYS = 3;
const BUDGET_APPROACH_THRESHOLD = 0.8;

/**
 * Genera un ID de notificación dentro del rango de int de Java
 * (Integer.MAX_VALUE ≈ 2.147e9). El plugin rechaza IDs mayores.
 * Usa un contador secuencial con reinicio para evitar desbordes.
 */
let notificationIdCounter = 1;
function notificationId(): number {
  const id = notificationIdCounter;
  notificationIdCounter = notificationIdCounter >= 2000000000 ? 1 : notificationIdCounter + 1;
  return id;
}

let lastRateNotifyAt = 0;
let lastNotifiedRates: { bcv: number | null; parallel: number | null } | null =
  null;

let budgetNotifyAt = 0;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Solicita el permiso de notificaciones en la plataforma nativa.
 * No hace nada en navegador.
 * @returns True si los permisos están concedidos.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === "granted") return true;
    if (display === "prompt" || display === "prompt-with-rationale") {
      const { display: result } = await LocalNotifications.requestPermissions();
      return result === "granted";
    }
    return false;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

/**
 * Notifica si una tasa cambió más del umbral respecto a la anterior.
 * Limita a una notificación por ventana de 30 minutos para no saturar.
 * @param previous Tasas previas (puede ser null la primera vez).
 * @param current Tasas recién obtenidas.
 */
export async function notifyRateChanges(
  previous: ExchangeRates | null,
  current: ExchangeRates,
): Promise<void> {
  if (!isNative()) return;
  if (Date.now() - lastRateNotifyAt < RATE_NOTIFY_COOLDOWN_MS) return;

  const baseline = lastNotifiedRates ?? {
    bcv: previous?.bcv ?? null,
    parallel: previous?.parallel ?? null,
  };

  const notifications: { title: string; body: string }[] = [];

  if (
    current.bcv !== null &&
    baseline.bcv !== null &&
    Math.abs(current.bcv - baseline.bcv) / baseline.bcv >=
      RATE_CHANGE_THRESHOLD
  ) {
    const dir = current.bcv > baseline.bcv ? "subió" : "bajó";
    const pct = Math.abs(
      ((current.bcv - baseline.bcv) / baseline.bcv) * 100,
    ).toFixed(2);
    notifications.push({
      title: "Tasa BCV actualizada",
      body: `El dólar oficial ${dir} a Bs. ${current.bcv.toFixed(2)} (${pct}%).`,
    });
  }

  if (
    current.parallel !== null &&
    baseline.parallel !== null &&
    Math.abs(current.parallel - baseline.parallel) / baseline.parallel >=
      RATE_CHANGE_THRESHOLD
  ) {
    const dir = current.parallel > baseline.parallel ? "subió" : "bajó";
    const pct = Math.abs(
      ((current.parallel - baseline.parallel) / baseline.parallel) * 100,
    ).toFixed(2);
    notifications.push({
      title: "Tasa paralela actualizada",
      body: `El dólar paralelo ${dir} a Bs. ${current.parallel.toFixed(2)} (${pct}%).`,
    });
  }

  if (notifications.length === 0) return;

  try {
    await LocalNotifications.schedule({
      notifications: notifications.map((n) => ({
        id: notificationId(),
        title: n.title,
        body: n.body,
        schedule: { at: new Date(Date.now() + 1000) },
      })),
    });
    lastRateNotifyAt = Date.now();
    lastNotifiedRates = {
      bcv: current.bcv,
      parallel: current.parallel,
    };
  } catch (error) {
    console.error("Error scheduling rate notification:", error);
  }
}

interface DebtReminder {
  id: number;
  title: string;
  body: string;
  schedule: { at: Date };
  extra: Record<string, string>;
}

/**
 * Garantiza que el horario de una notificación sea en el futuro.
 * Si el tiempo calculado ya pasó (ej: se abrió la app después de las
 * 9 AM del día del recordatorio), programa para ~2 segundos para que
 * se dispare al momento de abrir.
 */
function futureScheduleAt(at: Date): Date {
  if (at.getTime() > Date.now() + 1000) return at;
  return new Date(Date.now() + 2000);
}

function formatDebtAmount(amount: number): string {
  return `Bs. ${amount.toLocaleString("es", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Programa recordatorios para las deudas pendientes o parciales con fecha límite:
 * - 7 días antes del vencimiento (aviso de aproximación).
 * - 3 días antes del vencimiento.
 * - El mismo día del vencimiento.
 * Cada notificación incluye el id de la deuda en `extra` para que al tocarla
 * la app abra esa deuda directamente.
 * Cancela notificaciones previas de deudas para evitar duplicados.
 * @param transactions Todas las transacciones.
 */
export async function scheduleDebtReminders(
  transactions: Transaction[],
): Promise<void> {
  if (!isNative()) return;

  const pendingDebts = transactions.filter(
    (t) =>
      t.type === "debt" &&
      t.debtStatus !== "paid" &&
      t.debtDueDate &&
      t.description,
  );

  const reminders: DebtReminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  pendingDebts.forEach((debt) => {
    const [y, m, d] = debt.debtDueDate!.split("-").map(Number);
    const due = new Date(y, m - 1, d);
    const dueTime = due.getTime();
    const daysUntil = Math.round((dueTime - today.getTime()) / 86400000);

    if (daysUntil < 0) return;

    const amountLabel = formatDebtAmount(debt.amount);
    const description = debt.description;
    const extra = { debtId: debt.id };

    if (daysUntil === 0) {
      reminders.push({
        id: notificationId(),
        title: "Deuda por vencer hoy",
        body: `${description} vence hoy (${amountLabel}).`,
        schedule: { at: futureScheduleAt(new Date(dueTime + 9 * 3600000)) },
        extra,
      });
    } else if (daysUntil > 0 && daysUntil <= DEBT_MID_DAYS) {
      const daysText = daysUntil === 1 ? "mañana" : `en ${daysUntil} días`;
      reminders.push({
        id: notificationId(),
        title: "Deuda por vencer pronto",
        body: `${description} vence ${daysText} (${amountLabel}).`,
        schedule: {
          at: futureScheduleAt(
            new Date(dueTime - daysUntil * 86400000 + 9 * 3600000),
          ),
        },
        extra,
      });
    } else if (daysUntil <= DEBT_WARNING_DAYS) {
      reminders.push({
        id: notificationId(),
        title: "Deuda por vencer pronto",
        body: `${description} vence en una semana (${amountLabel}).`,
        schedule: {
          at: futureScheduleAt(
            new Date(dueTime - DEBT_WARNING_DAYS * 86400000 + 9 * 3600000),
          ),
        },
        extra,
      });
    }
  });

  try {
    const pending = await LocalNotifications.getPending();
    await LocalNotifications.cancel({
      notifications: pending.notifications,
    });
  } catch (error) {
    console.error("Error canceling pending notifications:", error);
    return;
  }

  if (reminders.length === 0) return;

  try {
    await LocalNotifications.schedule({ notifications: reminders });
  } catch (error) {
    console.error("Error scheduling debt reminders:", error);
  }
}

/**
 * Notifica cuando un gasto supera (o se acerca al 80% de) un presupuesto
 * configurado para el mes actual. Limita a una notificación por ventana
 * de 30 minutos para no saturar.
 * @param transactions Todas las transacciones.
 * @param budgets Presupuestos por categoría.
 * @param currency Símbolo de moneda.
 */
export async function notifyBudgetAlerts(
  transactions: Transaction[],
  budgets: Record<string, number>,
  currency: string,
): Promise<void> {
  if (!isNative()) return;
  if (Date.now() - budgetNotifyAt < RATE_NOTIFY_COOLDOWN_MS) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const spentByCat: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type !== "expense" || !t.description) return;
    const [, ty, tm] = t.date.split("-").map(Number);
    if (ty === year && tm === month + 1) {
      spentByCat[t.category] = (spentByCat[t.category] || 0) + t.amount;
    }
  });

  const notifications: { title: string; body: string }[] = [];

  Object.entries(budgets).forEach(([categoryId, budget]) => {
    if (budget <= 0) return;
    const spent = spentByCat[categoryId] || 0;
    const cat = getCategoryById(categoryId);
    const pct = spent / budget;

    if (spent > budget) {
      const over = spent - budget;
      notifications.push({
        title: "Presupuesto superado",
        body: `${cat.name}: gastaste ${formatMoney(over, currency)} más de tu presupuesto de ${formatMoney(budget, currency)}.`,
      });
    } else if (pct >= BUDGET_APPROACH_THRESHOLD) {
      notifications.push({
        title: "Presupuesto casi al límite",
        body: `${cat.name}: llevas ${formatMoney(spent, currency)} de ${formatMoney(budget, currency)} (${Math.round(pct * 100)}%).`,
      });
    }
  });

  if (notifications.length === 0) return;

  try {
    await LocalNotifications.schedule({
      notifications: notifications.map((n) => ({
        id: notificationId(),
        title: n.title,
        body: n.body,
        schedule: { at: new Date(Date.now() + 1000) },
      })),
    });
    budgetNotifyAt = Date.now();
  } catch (error) {
    console.error("Error scheduling budget notification:", error);
  }
}
