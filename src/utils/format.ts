import { getLanguage } from "../i18n";

/**
 * Formatea un monto numérico con la moneda actual.
 * @param amount Monto a formatear.
 * @param currency Símbolo de moneda.
 * @returns Texto con moneda y dos decimales.
 */
export function formatMoney(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const locale = getLanguage() === "en" ? "en" : "es";
  return (
    currency +
    abs
      .toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      .replace(/\./g, ".\u200B")
  );
}
