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
 * Convierte una fecha a string "YYYY-MM-DD" usando componentes locales.
 * No usa toISOString() para evitar el desfase de zona horaria (UTC).
 * @param date Fecha a formatear.
 * @returns Fecha local en formato ISO.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Convierte un string "YYYY-MM-DD" a Date usando hora local.
 * No usa new Date(str) para evitar que se interprete como medianoche UTC.
 * @param dateStr Fecha local en formato ISO.
 * @returns Date local a medianoche.
 */
export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}
