import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { monthName, t } from "../i18n";
import type { Transaction } from "../types";
import { getCategoryById } from "./transactions";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function typeLabel(type: Transaction["type"]): string {
  if (type === "expense") return t("export.type_expense");
  if (type === "income") return t("export.type_income");
  return t("export.type_debt");
}

/**
 * Genera el contenido CSV de las transacciones del mes.
 * @param transactions Transacciones visibles del mes (ya expandidas).
 * @param currency Símbolo de moneda.
 * @returns String CSV.
 */
export function buildTransactionsCSV(
  transactions: Transaction[],
  currency: string,
): string {
  const header = [
    t("export.header_date"),
    t("export.header_type"),
    t("export.header_category"),
    t("export.header_description"),
    t("export.header_amount"),
    t("export.header_debt_status"),
  ];
  const rows = transactions.map((trx) => {
    const cat = getCategoryById(trx.category);
    return [
      trx.date,
      typeLabel(trx.type),
      cat.name,
      trx.description,
      `${currency} ${trx.amount.toLocaleString("es", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      trx.type === "debt"
        ? trx.debtStatus === "paid"
          ? t("export.status_paid")
          : trx.debtStatus === "partial"
            ? t("export.status_partial")
            : t("export.status_pending")
        : "",
    ]
      .map(csvEscape)
      .join(",");
  });
  return [header.map(csvEscape).join(","), ...rows].join("\n");
}

export function csvFilename(month: number, year: number): string {
  const name = monthName(month).toLowerCase();
  return `${t("export.filename", { month: name, year })}.csv`;
}

/**
 * Exporta las transacciones a CSV. En web descarga el archivo; en nativo
 * lo escribe a disco y abre el menú de compartir.
 * @returns True si la exportación se inició correctamente.
 */
export async function exportTransactionsToCSV(
  transactions: Transaction[],
  currency: string,
  month: number,
  year: number,
): Promise<boolean> {
  const csv = buildTransactionsCSV(transactions, currency);
  const filename = csvFilename(month, year);

  if (!Capacitor.isNativePlatform()) {
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }

  try {
    const result = await Filesystem.writeFile({
      path: filename,
      data: "\uFEFF" + csv,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({
      title: filename,
      text: t("export.share_text"),
      url: result.uri,
      dialogTitle: t("export.share_dialog"),
    });
    return true;
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return false;
  }
}