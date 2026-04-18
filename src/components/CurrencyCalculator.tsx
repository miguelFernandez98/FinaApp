import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context";
import { formatMoney } from "../utils/helpers";

export default function CurrencyCalculator() {
  const { exchangeRates, currency } = useApp();
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState<
    "VES" | "USD_BCV" | "USD_BINANCE"
  >("VES");
  const [toCurrency, setToCurrency] = useState<
    "VES" | "USD_BCV" | "USD_BINANCE"
  >("USD_BCV");

  // Debug: mostrar tasas en consola
  useEffect(() => {
    console.log("💱 Current exchange rates:", exchangeRates);
  }, [exchangeRates]);

  const convertAmount = (
    value: number,
    from: string,
    to: string,
  ): number | null => {
    if (from === to) return value;

    const rates = {
      VES: 1,
      USD_BCV: exchangeRates.bcv,
      USD_BINANCE: exchangeRates.binance,
    };

    const fromRate = rates[from as keyof typeof rates];
    const toRate = rates[to as keyof typeof rates];

    if (!fromRate || !toRate) return null;

    // Convertir a VES primero, luego al destino
    const inVES = from === "VES" ? value : value * fromRate;
    const result = to === "VES" ? inVES : inVES / toRate;

    return result;
  };

  const result = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || fromCurrency === toCurrency) return null;

    const converted = convertAmount(numAmount, fromCurrency, toCurrency);
    return converted !== null ? formatMoney(converted, currency) : null;
  }, [amount, fromCurrency, toCurrency, exchangeRates, currency]);

  return (
    <div className="glass-card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <h3 className="card-title">Calculadora de Divisas</h3>
        <span className="card-subtitle">
          {exchangeRates.lastUpdated
            ? `Actualizado: ${new Date(exchangeRates.lastUpdated).toLocaleTimeString()}`
            : "Cargando tasas..."}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="field-label">Monto</label>
          <input
            type="number"
            className="input-field"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ingresa el monto"
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">De</label>
            <select
              className="input-field"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as any)}
            >
              <option value="VES">Bolívares (VES)</option>
              <option value="USD_BCV">Dólar BCV</option>
              <option value="USD_BINANCE">Dólar Binance</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label className="field-label">A</label>
            <select
              className="input-field"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value as any)}
            >
              <option value="VES">Bolívares (VES)</option>
              <option value="USD_BCV">Dólar BCV</option>
              <option value="USD_BINANCE">Dólar Binance</option>
            </select>
          </div>
        </div>

        {result && (
          <div
            style={{
              textAlign: "center",
              padding: 12,
              background: "var(--card)",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "var(--fg-muted)",
                marginBottom: 4,
              }}
            >
              Resultado
            </div>
            <div
              style={{ fontSize: 18, fontWeight: 600, color: "var(--accent)" }}
            >
              {result}
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            fontSize: 12,
          }}
        >
          <div>
            <div style={{ color: "var(--fg-muted)" }}>BCV:</div>
            <div>
              {exchangeRates.bcv
                ? formatMoney(exchangeRates.bcv, "Bs.")
                : "Cargando..."}
            </div>
          </div>
          <div>
            <div style={{ color: "var(--fg-muted)" }}>Binance:</div>
            <div>
              {exchangeRates.binance
                ? formatMoney(exchangeRates.binance, "Bs.")
                : "Cargando..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
