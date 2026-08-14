import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { Transaction } from "../types";
import { getCategoryById } from "./transactions";
import { MONTH_NAMES } from "./date";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function typeLabel(type: Transaction["type"]): string {
  if (type === "expense") return "Gasto";
  if (type === "income") return "Ingreso";
  return "Deuda";
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
    "Fecha",
    "Tipo",
    "Categoría",
    "Descripción",
    "Monto",
    "Estado de deuda",
  ];
  const rows = transactions.map((t) => {
    const cat = getCategoryById(t.category);
    return [
      t.date,
      typeLabel(t.type),
      cat.name,
      t.description,
      `${currency} ${t.amount.toLocaleString("es", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      t.type === "debt"
        ? t.debtStatus === "paid"
          ? "Pagada"
          : t.debtStatus === "partial"
            ? "Parcialmente pagada"
            : "Pendiente"
        : "",
    ]
      .map(csvEscape)
      .join(",");
  });
  return [header.map(csvEscape).join(","), ...rows].join("\n");
}

export function csvFilename(month: number, year: number): string {
  const monthName = MONTH_NAMES[month].toLowerCase();
  return `finanzas-${monthName}-${year}.csv`;
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
      text: "Exportación de finanzas",
      url: result.uri,
      dialogTitle: "Compartir o guardar el reporte",
    });
    return true;
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return false;
  }
}