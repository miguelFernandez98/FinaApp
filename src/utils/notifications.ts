import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Transaction } from "../types";
import type { ExchangeRates } from "./exchangeRates";

const RATE_CHANGE_THRESHOLD = 0.01;
const DEBT_WARNING_DAYS = 7;

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
 * @param previous Tasas previas (puede ser null la primera vez).
 * @param current Tasas recién obtenidas.
 */
export async function notifyRateChanges(
  previous: ExchangeRates | null,
  current: ExchangeRates,
): Promise<void> {
  if (!isNative()) return;

  const notifications: { title: string; body: string }[] = [];

  if (
    current.bcv !== null &&
    previous?.bcv !== null &&
    previous?.bcv !== undefined &&
    Math.abs(current.bcv - previous.bcv) / previous.bcv >= RATE_CHANGE_THRESHOLD
  ) {
    const dir = current.bcv > previous.bcv ? "subió" : "bajó";
    const pct = Math.abs(
      ((current.bcv - previous.bcv) / previous.bcv) * 100,
    ).toFixed(2);
    notifications.push({
      title: "Tasa BCV actualizada",
      body: `El dólar oficial ${dir} a Bs. ${current.bcv.toFixed(2)} (${pct}%).`,
    });
  }

  if (
    current.parallel !== null &&
    previous?.parallel !== null &&
    previous?.parallel !== undefined &&
    Math.abs(current.parallel - previous.parallel) / previous.parallel >=
      RATE_CHANGE_THRESHOLD
  ) {
    const dir = current.parallel > previous.parallel ? "subió" : "bajó";
    const pct = Math.abs(
      ((current.parallel - previous.parallel) / previous.parallel) * 100,
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
        id: Date.now() + Math.floor(Math.random() * 10000),
        title: n.title,
        body: n.body,
        schedule: { at: new Date(Date.now() + 1000) },
      })),
    });
  } catch (error) {
    console.error("Error scheduling rate notification:", error);
  }
}

interface DebtReminder {
  id: number;
  title: string;
  body: string;
  schedule: { at: Date };
}

/**
 * Programa recordatorios para las deudas pendientes o parciales:
 * - 7 días antes del vencimiento (aviso de aproximación).
 * - El mismo día del vencimiento.
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

    const amountLabel = `Bs. ${debt.amount.toLocaleString("es", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    const description = debt.description;

    if (daysUntil === 0) {
      reminders.push({
        id: Date.now() + reminders.length + 1,
        title: "Deuda por vencer hoy",
        body: `${description} vence hoy (${amountLabel}).`,
        schedule: { at: new Date(dueTime + 9 * 3600000) },
      });
    } else if (daysUntil > 0 && daysUntil <= DEBT_WARNING_DAYS) {
      const daysText =
        daysUntil === 1
          ? "mañana"
          : daysUntil === DEBT_WARNING_DAYS
            ? "en una semana"
            : `en ${daysUntil} días`;
      reminders.push({
        id: Date.now() + reminders.length + 1,
        title: "Deuda por vencer pronto",
        body: `${description} vence ${daysText} (${amountLabel}).`,
        schedule: {
          at: new Date(dueTime - daysUntil * 86400000 + 9 * 3600000),
        },
      });
    }
  });

  if (reminders.length === 0) return;

  try {
    const pending = await LocalNotifications.getPending();
    await LocalNotifications.cancel({
      notifications: pending.notifications,
    });
    await LocalNotifications.schedule({ notifications: reminders });
  } catch (error) {
    console.error("Error scheduling debt reminders:", error);
  }
}
