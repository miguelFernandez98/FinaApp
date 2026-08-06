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
