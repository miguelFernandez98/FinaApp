import { Capacitor } from "@capacitor/core";
import { WidgetBridgePlugin } from "capacitor-widget-bridge";
import { loadState, loadExchangeRates } from "../storage";
import {
  getMonthTransactions,
  sumByType,
  calculateMonthDebtAmount,
} from "./transactions";

const WIDGET_GROUP = "com.finaapp.app";
const WIDGET_KEY = "widget_data";
const WIDGET_CLASS = "com.finaapp.app.widget.FinanceWidget";
const SYNC_THROTTLE_MS = 5 * 60 * 1000;

let lastSyncAt = 0;

export async function syncWidgetData(): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return;
  if (Date.now() - lastSyncAt < SYNC_THROTTLE_MS) return;

  try {
    const state = loadState();
    const rates = loadExchangeRates();
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthTxns = getMonthTransactions(
      state.transactions,
      month,
      year,
    ).filter((t) => t.type !== "debt");

    const income = sumByType(monthTxns, "income");
    const expenses = sumByType(monthTxns, "expense");
    const debt = calculateMonthDebtAmount(state.transactions, month, year);
    const balance = income - expenses - debt;

    const data = {
      balance,
      income,
      expenses,
      bcv: rates?.bcv ?? null,
      parallel: rates?.parallel ?? null,
      currency: state.currency,
      lastUpdated: new Date().toISOString(),
    };

    await WidgetBridgePlugin.setItem({
      group: WIDGET_GROUP,
      key: WIDGET_KEY,
      value: JSON.stringify(data),
    });

    await WidgetBridgePlugin.setRegisteredWidgets({
      widgets: [WIDGET_CLASS],
    });

    await WidgetBridgePlugin.reloadAllTimelines();
    lastSyncAt = Date.now();
  } catch (error) {
    console.warn("Error syncing widget data:", error);
  }
}
