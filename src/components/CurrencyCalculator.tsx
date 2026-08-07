import { useState, useMemo, useEffect, useCallback } from "react";
import { useApp } from "../AppContext";
import { formatMoney } from "../utils/format";

type CurrencyType = "VES" | "USD_BCV" | "USD_PARALLEL";

export default function CurrencyCalculator() {
  const { exchangeRates } = useApp();
  const [amount, setAmount] = useState("");

  const [fromCurrency, setFromCurrency] = useState<CurrencyType>("VES");
  const [toCurrency, setToCurrency] = useState<CurrencyType>("USD_BCV");

  useEffect(() => {
    console.log("💱 Current exchange rates:", exchangeRates);
  }, [exchangeRates]);

  const handleFromChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFrom = e.target.value as CurrencyType;
    if (newFrom === toCurrency) {
      setToCurrency(fromCurrency);
    }
    setFromCurrency(newFrom);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTo = e.target.value as CurrencyType;
    if (newTo === fromCurrency) {
      setFromCurrency(toCurrency);
    }
    setToCurrency(newTo);
  };

  const convertAmount = useCallback(
    (value: number, from: string, to: string): number | null => {
      if (from === to) return value;
      const rates = {
        VES: 1,
        USD_BCV: exchangeRates.bcv,
        USD_PARALLEL: exchangeRates.parallel,
      };
      const fromRate = rates[from as keyof typeof rates];
      const toRate = rates[to as keyof typeof rates];
      if (!fromRate || !toRate) return null;
      const inVES = from === "VES" ? value : value * fromRate;
      const result = to === "VES" ? inVES : inVES / toRate;
      return result;
    },
    [exchangeRates],
  );

  const result = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || fromCurrency === toCurrency) return null;
    const converted = convertAmount(numAmount, fromCurrency, toCurrency);
    if (converted === null) return null;
    const rounded = Number(converted.toFixed(2));
    const symbol = toCurrency === "VES" ? "Bs." : "$";
    return formatMoney(rounded, symbol);
  }, [amount, fromCurrency, toCurrency, convertAmount]);

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
            onChange={(e) => {
              if (e.target.value.length <= 18) setAmount(e.target.value);
            }}
            placeholder="Ingresa el monto"
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">De</label>
            <select
              className="input-field"
              value={fromCurrency}
              onChange={handleFromChange}
            >
              <option value="VES">Bolívares (VES)</option>
              <option value="USD_BCV">Dólar BCV</option>
              <option value="USD_PARALLEL">Dólar Paralelo</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label className="field-label">A</label>
            <select
              className="input-field"
              value={toCurrency}
              onChange={handleToChange}
            >
              <option value="VES">Bolívares (VES)</option>
              <option value="USD_BCV">Dólar BCV</option>
              <option value="USD_PARALLEL">Dólar Paralelo</option>
            </select>
          </div>
        </div>

        {result && (
          <div
            style={{
              textAlign: "start",
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
              Resultado:
            </div>
            <div
              style={{ fontSize: 18, fontWeight: 600, color: "var(--accent)", overflow: "scroll" }}
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
            <div style={{ color: "var(--accent)" }}>BCV:</div>
            <div>
              {exchangeRates.bcv
                ? formatMoney(exchangeRates.bcv, "Bs.")
                : "Cargando..."}
            </div>
          </div>
          <div>
            <div style={{ color: "#F0B90B" }}>Paralelo:</div>
            <div>
              {exchangeRates.parallel
                ? formatMoney(exchangeRates.parallel, "Bs.")
                : "Cargando..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
