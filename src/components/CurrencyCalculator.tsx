import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAppData, useAppUI, useAppActions } from "../AppContext";
import { t, useI18n } from "../i18n";
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
  const { showEUR, showCustomRate, customRate } = useAppData();
  const { exchangeRates } = useAppUI();
  const { setCustomRate } = useAppActions();
  const { language } = useI18n();
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

  const [bcvAnimating, setBcvAnimating] = useState(false);
  const [parAnimating, setParAnimating] = useState(false);
  const bcvTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBcvAnim = useCallback(() => {
    if (bcvTimerRef.current) clearTimeout(bcvTimerRef.current);
    setBcvAnimating(false);
    requestAnimationFrame(() => {
      setBcvAnimating(true);
      bcvTimerRef.current = setTimeout(() => setBcvAnimating(false), 450);
    });
  }, []);

  const triggerParAnim = useCallback(() => {
    if (parTimerRef.current) clearTimeout(parTimerRef.current);
    setParAnimating(false);
    requestAnimationFrame(() => {
      setParAnimating(true);
      parTimerRef.current = setTimeout(() => setParAnimating(false), 450);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (bcvTimerRef.current) clearTimeout(bcvTimerRef.current);
      if (parTimerRef.current) clearTimeout(parTimerRef.current);
    };
  }, []);

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
      triggerBcvAnim();
    }, 3500);
    return () => clearInterval(interval);
  }, [showEUR, bcvManualUntil, triggerBcvAnim]);

  const effectiveBcvDisplay: BcvDisplay = showEUR ? bcvDisplay : "USD";

  const handleBcvClick = () => {
    if (!showEUR) return;
    setBcvManualUntil(Date.now() + 7000);
    setBcvDisplay((prev) => (prev === "USD" ? "EUR" : "USD"));
    triggerBcvAnim();
  };

  // Alterna automáticamente entre Paralelo y Tasa personalizada cada 3.5s
  // (solo si hay tasa personalizada registrada y habilitada).
  useEffect(() => {
    if (!showCustomRate || customRate === null) return;
    const interval = setInterval(() => {
      if (Date.now() < parallelManualUntil) return;
      setParallelShowCustom((prev) => !prev);
      triggerParAnim();
    }, 3500);
    return () => clearInterval(interval);
  }, [showCustomRate, customRate, parallelManualUntil, triggerParAnim]);

  const handleParallelClick = () => {
    if (!showCustomRate || customRate === null) return;
    setParallelManualUntil(Date.now() + 7000);
    setParallelShowCustom((prev) => !prev);
    triggerParAnim();
  };

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
    const opts: Array<{ value: string; label: string }> = [      { value: "VES", label: t("calc.option_ves") },
      { value: "USD_BCV", label: t("calc.option_usd_bcv") },
      { value: "USD_PARALLEL", label: t("calc.option_usd_parallel") },
      ...(showEUR ? [{ value: "EUR", label: t("calc.option_eur") }] : []),
    ];
    if (showCustomRate) {
      opts.push({ value: "CUSTOM", label: t("calc.option_custom") });
    }
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEUR, showCustomRate, language]);

  const handleSwap = () => {
    setFromCurrency(effectiveTo);
    setToCurrency(effectiveFrom);
  };

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
        const locale = language === "en" ? "en" : "es-VE";
        return {
          date: d.toLocaleDateString(locale, { dateStyle: "medium" }),
          time: d.toLocaleTimeString(locale, { timeStyle: "short" }),
        };
      })()
    : null;

  const rateDisplay = (rate: number | null | undefined): string => {
    if (rate) return formatMoney(rate, "Bs.");
    if (exchangeRates.lastUpdated === null) return t("calc.loading_short");
    return t("calc.nd");
  };

  const parallelRate = parallelShowCustom && customRate !== null
    ? customRate
    : exchangeRates.parallel;

  return (
    <div className="glass-card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <h3 className="card-title">{t("calc.title")}</h3>
        {exchangeRates.fromCache ? (
          <span
            style={{
              fontSize: 12,
              color: "var(--warning)",
              fontWeight: 600,
              textAlign: "right",
              display: "block",
            }}
            title={t("calc.cache")}
          >
            <i className="fa-solid fa-cloud-arrow-down" /> {t("calc.cache")}
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
                {t("calc.updated")}
                <br />
                {lastUpdatedParts.date} · {lastUpdatedParts.time}
              </>
            ) : (
              t("calc.loading")
            )}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="field-label" htmlFor="currency-amount">
            {t("calc.amount")}
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
            placeholder={t("calc.amount_placeholder")}
            aria-label={t("calc.amount_aria")}
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="field-label" htmlFor="from-currency">
              {t("calc.from")}
            </label>
            <CustomSelect
              id="from-currency"
              value={effectiveFrom}
              onChange={handleFromChange}
              options={currencyOptions}
            />
          </div>

          <button
            type="button"
            className="swap-btn"
            onClick={handleSwap}
            aria-label={t("calc.swap_aria")}
            title={t("calc.swap")}
          >
            <i className="fa-solid fa-arrow-right-arrow-left" />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="field-label" htmlFor="to-currency">
              {t("calc.to")}
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
              {t("calc.result")}
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
            className={bcvAnimating ? "rate-swap-animating" : ""}
            style={{
              cursor: showEUR ? "pointer" : "default",
              userSelect: "none",
            }}
            title={showEUR ? t("calc.bcv_tap_title") : undefined}
          >
            <div
              className="rate-swap"
              style={{ color: "var(--accent)" }}
            >
              {effectiveBcvDisplay === "EUR"
                ? t("calc.bcv_eur")
                : t("calc.bcv_usd")}
            </div>
            <div
              className="rate-swap"
            >
              {effectiveBcvDisplay === "EUR"
                ? rateDisplay(exchangeRates.eur)
                : rateDisplay(exchangeRates.bcv)}
            </div>
          </div>
          <div
            onClick={handleParallelClick}
            className={parAnimating ? "rate-swap-animating" : ""}
            style={{
              cursor:
                showCustomRate && customRate !== null ? "pointer" : "default",
              userSelect: "none",
            }}
            title={
              showCustomRate && customRate !== null
                ? t("calc.parallel_tap_title")
                : undefined
            }
          >
            <div
              className="rate-swap"
              style={{ color: "#F0B90B" }}
            >
              {parallelShowCustom && customRate !== null
                ? t("calc.custom")
                : t("calc.parallel")}
            </div>
            <div
              className="rate-swap"
            >
              {parallelRate === null ? rateDisplay(null) : rateDisplay(parallelRate)}
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
            aria-label={t("calc.custom_rate")}
          >
            <div className="modal-handle" />
            <h3 className="custom-rate-modal-title">{t("calc.custom_rate")}</h3>
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
                placeholder={t("calc.custom_placeholder")}
                aria-label={t("calc.custom_aria")}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={saveCustomRate}
                title={t("calc.custom_save")}
                aria-label={t("calc.custom_save_aria")}
              >
                <i className="fa-solid fa-check" />
              </button>
              {customRate !== null && (
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  onClick={clearCustomRate}
                  title={t("calc.custom_delete")}
                  aria-label={t("calc.custom_delete_aria")}
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
              {t("calc.custom_cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
