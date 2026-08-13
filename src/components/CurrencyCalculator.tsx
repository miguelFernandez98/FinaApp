import { useState, useMemo, useEffect, useCallback } from "react";
import { useApp } from "../AppContext";
import { formatMoney } from "../utils/format";

type CurrencyType = "VES" | "USD_BCV" | "USD_PARALLEL" | "EUR";
type BcvDisplay = "USD" | "EUR";

const MAX_AMOUNT = 1e15;

function sanitizeAmount(raw: string): string {
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(/,/g, ".");
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return "";
  if (!Number.isFinite(value) || Math.abs(value) > MAX_AMOUNT) return "";
  return cleaned;
}

export default function CurrencyCalculator() {
  const { exchangeRates, showEUR } = useApp();
  const [amount, setAmount] = useState("");

  const [fromCurrency, setFromCurrency] = useState<CurrencyType>("VES");
  const [toCurrency, setToCurrency] = useState<CurrencyType>("USD_BCV");
  const [bcvDisplay, setBcvDisplay] = useState<BcvDisplay>("USD");
  const [bcvManual, setBcvManual] = useState(false);

  // Alterna automáticamente entre BCV $ y BCV € cada 3.5s (solo si showEUR).
  // Un toque en el indicador fija la moneda manualmente.
  useEffect(() => {
    if (!showEUR || bcvManual) return;
    const interval = setInterval(() => {
      setBcvDisplay((prev) => (prev === "USD" ? "EUR" : "USD"));
    }, 3500);
    return () => clearInterval(interval);
  }, [showEUR, bcvManual]);

  const effectiveBcvDisplay: BcvDisplay = showEUR ? bcvDisplay : "USD";

  const handleBcvClick = () => {
    if (!showEUR) return;
    setBcvDisplay((prev) => (prev === "USD" ? "EUR" : "USD"));
    setBcvManual(true);
  };

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
      const rates: Record<string, number | null> = {
        VES: 1,
        USD_BCV: exchangeRates.bcv,
        USD_PARALLEL: exchangeRates.parallel,
        EUR: exchangeRates.eur,
      };
      const fromRate = rates[from];
      const toRate = rates[to];
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
    const symbol =
      toCurrency === "VES"
        ? "Bs."
        : toCurrency === "EUR"
          ? "€"
          : "$";
    return formatMoney(rounded, symbol);
  }, [amount, fromCurrency, toCurrency, convertAmount]);

  const lastUpdatedParts = exchangeRates.lastUpdated
    ? (() => {
        const d = new Date(exchangeRates.lastUpdated);
        return {
          date: d.toLocaleDateString("es-VE", { dateStyle: "medium" }),
          time: d.toLocaleTimeString("es-VE", { timeStyle: "short" }),
        };
      })()
    : null;

  const rateDisplay = (rate: number | null | undefined): string => {
    if (rate) return formatMoney(rate, "Bs.");
    if (exchangeRates.lastUpdated === null) return "Cargando...";
    return "N/D";
  };

  return (
    <div className="glass-card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <h3 className="card-title">Calculadora de Divisas</h3>
        {exchangeRates.fromCache ? (
          <span
            style={{
              fontSize: 12,
              color: "var(--warning)",
              fontWeight: 600,
              textAlign: "right",
              display: "block",
            }}
            title="Las tasas provienen de la última sincronización guardada"
          >
            <i className="fa-solid fa-cloud-arrow-down" /> Caché
            {lastUpdatedParts && (
              <>
                <br />
                {lastUpdatedParts.date} · {lastUpdatedParts.time}
              </>
            )}
          </span>
        ) : (
          <span
            className="card-subtitle"
            style={{ textAlign: "right", display: "block" }}
          >
            {lastUpdatedParts ? (
              <>
                Actualizado
                <br />
                {lastUpdatedParts.date} · {lastUpdatedParts.time}
              </>
            ) : (
              "Cargando tasas..."
            )}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="field-label" htmlFor="currency-amount">
            Monto
          </label>
          <input
            id="currency-amount"
            type="text"
            inputMode="decimal"
            className="input-field"
            value={amount}
            onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
            placeholder="Ingresa el monto"
            aria-label="Monto a convertir"
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label" htmlFor="from-currency">
              De
            </label>
            <select
              id="from-currency"
              className="input-field"
              value={fromCurrency}
              onChange={handleFromChange}
            >
              <option value="VES">Bolívares (VES)</option>
              <option value="USD_BCV">Dólar BCV</option>
              <option value="USD_PARALLEL">Dólar Paralelo</option>
              {showEUR && <option value="EUR">Euro (EUR)</option>}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label className="field-label" htmlFor="to-currency">
              A
            </label>
            <select
              id="to-currency"
              className="input-field"
              value={toCurrency}
              onChange={handleToChange}
            >
              <option value="VES">Bolívares (VES)</option>
              <option value="USD_BCV">Dólar BCV</option>
              <option value="USD_PARALLEL">Dólar Paralelo</option>
              {showEUR && <option value="EUR">Euro (EUR)</option>}
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
          <div
            onClick={handleBcvClick}
            style={{
              cursor: showEUR ? "pointer" : "default",
              userSelect: "none",
            }}
            title={showEUR ? "Toca para cambiar entre BCV $ y BCV €" : undefined}
          >
            <div
              key={effectiveBcvDisplay}
              className="rate-swap"
              style={{ color: "var(--accent)" }}
            >
              {effectiveBcvDisplay === "EUR" ? "BCV €:" : "BCV $:"}
            </div>
            <div
              key={`${effectiveBcvDisplay}-value`}
              className="rate-swap"
            >
              {effectiveBcvDisplay === "EUR"
                ? rateDisplay(exchangeRates.eur)
                : rateDisplay(exchangeRates.bcv)}
            </div>
          </div>
          <div>
            <div style={{ color: "#F0B90B" }}>Paralelo:</div>
            <div>{rateDisplay(exchangeRates.parallel)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
