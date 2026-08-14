import { useState, useMemo, useEffect, useCallback } from "react";
import { useApp } from "../AppContext";
import { formatMoney } from "../utils/format";
import CustomSelect from "./CustomSelect";

type CurrencyType = "VES" | "USD_BCV" | "USD_PARALLEL" | "EUR" | "CUSTOM";
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
  const {
    exchangeRates,
    showEUR,
    showCustomRate,
    customRate,
    setCustomRate,
  } = useApp();
  const [amount, setAmount] = useState("");

  const [fromCurrency, setFromCurrency] = useState<CurrencyType>("VES");
  const [toCurrency, setToCurrency] = useState<CurrencyType>("USD_BCV");
  const [bcvDisplay, setBcvDisplay] = useState<BcvDisplay>("USD");
  const [bcvManualUntil, setBcvManualUntil] = useState(0);
  const [parallelShowCustom, setParallelShowCustom] = useState(false);
  const [parallelManualUntil, setParallelManualUntil] = useState(0);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [pendingTarget, setPendingTarget] = useState<"from" | "to" | null>(
    null,
  );

  const effectiveFrom: CurrencyType =
    fromCurrency === "CUSTOM" && !showCustomRate ? "VES" : fromCurrency;
  const effectiveTo: CurrencyType =
    toCurrency === "CUSTOM" && !showCustomRate ? "USD_BCV" : toCurrency;

  // Alterna automáticamente entre BCV $ y BCV € cada 3.5s (solo si showEUR).
  // Tras un toque manual, mantiene la elección unos segundos y luego retoma el ciclo.
  useEffect(() => {
    if (!showEUR) return;
    const interval = setInterval(() => {
      if (Date.now() < bcvManualUntil) return;
      setBcvDisplay((prev) => (prev === "USD" ? "EUR" : "USD"));
    }, 3500);
    return () => clearInterval(interval);
  }, [showEUR, bcvManualUntil]);

  const effectiveBcvDisplay: BcvDisplay = showEUR ? bcvDisplay : "USD";

  const handleBcvClick = () => {
    if (!showEUR) return;
    setBcvManualUntil(Date.now() + 7000);
    setBcvDisplay((prev) => (prev === "USD" ? "EUR" : "USD"));
  };

  // Alterna automáticamente entre Paralelo y Tasa personalizada cada 3.5s
  // (solo si hay tasa personalizada registrada y habilitada).
  useEffect(() => {
    if (!showCustomRate || customRate === null) return;
    const interval = setInterval(() => {
      if (Date.now() < parallelManualUntil) return;
      setParallelShowCustom((prev) => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, [showCustomRate, customRate, parallelManualUntil]);

  const handleParallelClick = () => {
    if (!showCustomRate || customRate === null) return;
    setParallelManualUntil(Date.now() + 7000);
    setParallelShowCustom((prev) => !prev);
  };

  useEffect(() => {
    console.log("💱 Current exchange rates:", exchangeRates);
  }, [exchangeRates]);

  const handleFromChange = (value: string) => {
    const newFrom = value as CurrencyType;
    if (newFrom === "CUSTOM") {
      setPendingTarget("from");
      setCustomDraft(customRate !== null ? String(customRate) : "");
      setCustomModalOpen(true);
      return;
    }
    if (newFrom === effectiveTo) {
      setToCurrency(effectiveFrom);
    }
    setFromCurrency(newFrom);
  };

  const handleToChange = (value: string) => {
    const newTo = value as CurrencyType;
    if (newTo === "CUSTOM") {
      setPendingTarget("to");
      setCustomDraft(customRate !== null ? String(customRate) : "");
      setCustomModalOpen(true);
      return;
    }
    if (newTo === effectiveFrom) {
      setFromCurrency(effectiveTo);
    }
    setToCurrency(newTo);
  };

  const currencyOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [
      { value: "VES", label: "Bolívares (VES)" },
      { value: "USD_BCV", label: "Dólar BCV" },
      { value: "USD_PARALLEL", label: "Dólar Paralelo" },
      ...(showEUR ? [{ value: "EUR", label: "Euro (EUR)" }] : []),
    ];
    if (showCustomRate) {
      opts.push({ value: "CUSTOM", label: "Tasa personalizada" });
    }
    return opts;
  }, [showEUR, showCustomRate]);

  const saveCustomRate = () => {
    const parsed = parseFloat(customDraft);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    setCustomRate(parsed);
    if (pendingTarget === "from") {
      setFromCurrency("CUSTOM");
      if (toCurrency === "CUSTOM") setToCurrency(fromCurrency);
    } else if (pendingTarget === "to") {
      setToCurrency("CUSTOM");
      if (fromCurrency === "CUSTOM") setFromCurrency(toCurrency);
    }
    closeCustomModal();
  };

  const closeCustomModal = () => {
    setCustomModalOpen(false);
    setPendingTarget(null);
  };

  const cancelCustomRate = () => {
    closeCustomModal();
  };

  const clearCustomRate = () => {
    setCustomRate(null);
    closeCustomModal();
  };

  const convertAmount = useCallback(
    (value: number, from: string, to: string): number | null => {
      if (from === to) return value;
      const rates: Record<string, number | null> = {
        VES: 1,
        USD_BCV: exchangeRates.bcv,
        USD_PARALLEL: exchangeRates.parallel,
        EUR: exchangeRates.eur,
        CUSTOM: customRate,
      };
      const fromRate = rates[from];
      const toRate = rates[to];
      if (!fromRate || !toRate) return null;
      const inVES = from === "VES" ? value : value * fromRate;
      const result = to === "VES" ? inVES : inVES / toRate;
      return result;
    },
    [exchangeRates, customRate],
  );

  const result = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || effectiveFrom === effectiveTo) return null;
    const converted = convertAmount(numAmount, effectiveFrom, effectiveTo);
    if (converted === null) return null;
    const rounded = Number(converted.toFixed(2));
    const symbol =
      effectiveTo === "VES"
        ? "Bs."
        : effectiveTo === "EUR"
          ? "€"
          : "$";
    return formatMoney(rounded, symbol);
  }, [amount, effectiveFrom, effectiveTo, convertAmount]);

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
            onChange={(e) => {
              const sanitized = sanitizeAmount(e.target.value);
              if (sanitized === "" && e.target.value !== "") return;
              setAmount(sanitized);
            }}
            placeholder="Ingresa el monto"
            aria-label="Monto a convertir"
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="field-label" htmlFor="from-currency">
              De
            </label>
            <CustomSelect
              id="from-currency"
              value={effectiveFrom}
              onChange={handleFromChange}
              options={currencyOptions}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="field-label" htmlFor="to-currency">
              A
            </label>
            <CustomSelect
              id="to-currency"
              value={effectiveTo}
              onChange={handleToChange}
              options={currencyOptions}
            />
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
          <div
            onClick={handleParallelClick}
            style={{
              cursor:
                showCustomRate && customRate !== null ? "pointer" : "default",
              userSelect: "none",
            }}
            title={
              showCustomRate && customRate !== null
                ? "Toca para cambiar entre Paralelo y Tasa personalizada"
                : undefined
            }
          >
            <div
              key={parallelShowCustom ? "parallel-custom" : "parallel"}
              className="rate-swap"
              style={{ color: "#F0B90B" }}
            >
              {parallelShowCustom && customRate !== null
                ? "Personalizada:"
                : "Paralelo:"}
            </div>
            <div
              key={
                parallelShowCustom
                  ? `custom-value-${customRate}`
                  : `parallel-value-${exchangeRates.parallel}`
              }
              className="rate-swap"
            >
              {parallelShowCustom && customRate !== null
                ? rateDisplay(customRate)
                : rateDisplay(exchangeRates.parallel)}
            </div>
          </div>
        </div>

      </div>

      {customModalOpen && (
        <div
          className="modal-overlay"
          style={{ alignItems: "center" }}
          onClick={cancelCustomRate}
        >
          <div
            className="custom-rate-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Tasa personalizada"
          >
            <div className="modal-handle" />
            <h3 className="custom-rate-modal-title">Tasa personalizada (Bs.)</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                id="custom-rate-input"
                type="text"
                inputMode="decimal"
                className="input-field custom-rate-input"
                value={customDraft}
                onChange={(e) => {
                  const sanitized = sanitizeAmount(e.target.value);
                  if (sanitized === "" && e.target.value !== "") return;
                  setCustomDraft(sanitized);
                }}
                placeholder="Ej: 3800"
                aria-label="Tasa personalizada en bolívares"
              />
              <button
                type="button"
                className="icon-btn"
                onClick={saveCustomRate}
                title="Guardar"
                aria-label="Guardar tasa personalizada"
              >
                <i className="fa-solid fa-check" />
              </button>
              {customRate !== null && (
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  onClick={clearCustomRate}
                  title="Eliminar"
                  aria-label="Eliminar tasa personalizada"
                >
                  <i className="fa-solid fa-trash" />
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn-ghost"
              style={{ width: "auto", margin: "12px auto 0", display: "block" }}
              onClick={cancelCustomRate}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
