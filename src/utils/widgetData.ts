import { Capacitor } from "@capacitor/core";
import { WidgetBridgePlugin } from "capacitor-widget-bridge";
import { loadExchangeRates } from "../storage";

const WIDGET_GROUP = "com.finaapp.app";
const WIDGET_KEY = "widget_data";
const WIDGET_CLASS = "com.finaapp.app.widget.FinanceWidget";
const SYNC_THROTTLE_MS = 5 * 60 * 1000;

let lastSyncAt = 0;

export async function syncWidgetData(): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return;
  if (Date.now() - lastSyncAt < SYNC_THROTTLE_MS) return;

  try {
    const rates = loadExchangeRates();

    const data = {
      bcv: rates?.bcv ?? null,
      parallel: rates?.parallel ?? null,
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
