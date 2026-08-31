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

/**
 * Convierte un monto de una moneda a otra usando la tasa equivalente.
 * Si las monedas son iguales, retorna el monto sin cambio.
 * @param amount Monto原始.
 * @param fromCurrency Moneda de origen ("$" o "Bs.").
 * @param toCurrency Moneda de destino.
 * @param rate Tasa de cambio (Bs. por $).
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number | null,
): number {
  if (fromCurrency === toCurrency || rate == null || rate <= 0) return amount;
  if (fromCurrency === "$" && toCurrency === "Bs.") return amount * rate;
  if (fromCurrency === "Bs." && toCurrency === "$") return amount / rate;
  return amount;
}
