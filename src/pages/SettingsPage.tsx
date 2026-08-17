import { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, FilesystemDirectory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { useApp } from "../AppContext";
import { t, useI18n } from "../i18n";
import { generateId } from "../utils/transactions";
import { daysInMonth, toISODate } from "../utils/date";
import { startTutorial } from "../utils/tutorial";
import type { Transaction } from "../types";
import { version } from "../../package.json";
import CustomSelect from "../components/CustomSelect";
import PinModal from "../components/PinModal";
import fLogo from "../assets/f-logo.svg";

const MAX_AMOUNT = 1e15;

function sanitizeAmount(raw: string): string {
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(/,/g, ".");
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return "";
  if (!Number.isFinite(value) || Math.abs(value) > MAX_AMOUNT) return "";
  return cleaned;
}

export default function SettingsPage() {
  const {
    currency,
    setCurrency,
    showCalculator,
    setShowCalculator,
    showEUR,
    setShowEUR,
    showCustomRate,
    setShowCustomRate,
    customRate,
    setCustomRate,
    language,
    setLanguage,
    transactions,
    budgets,
    showConfirm,
    showToast,
    importState,
    pinHash,
    setPinHash,
    useBiometrics,
    setUseBiometrics,
    goals,
    lastExportAt,
    setLastExportAt,
    hasSeenTutorial,
    navigateTo,
    openTransactionModal,
    closeTransactionModal,
  } = useApp();
  useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [customDraft, setCustomDraft] = useState(
    customRate !== null ? String(customRate) : "",
  );
  const [ratesOpen, setRatesOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    showToast(t("settings.currency_updated"));
  };

  const handleSaveCustomRate = () => {
    const parsed = parseFloat(customDraft);
    if (Number.isNaN(parsed) || parsed <= 0) {
      showToast(
        t("settings.custom_enter"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }
    setCustomRate(parsed);
    showToast(t("settings.custom_saved"));
  };

  const handleClearCustomRate = () => {
    setCustomRate(null);
    setCustomDraft("");
    showToast(t("settings.custom_removed"));
  };

  const handleExport = async () => {
    const data = JSON.stringify(
      {
        transactions,
        budgets,
        currency,
        showCalculator,
        showEUR,
        showCustomRate,
        customRate,
        language,
        pinHash,
        useBiometrics,
        goals,
        lastExportAt,
        hasSeenTutorial,
      },
      null,
      2,
    );
    const filename = `finanzapp_backup_${toISODate(new Date())}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: filename,
          data,
          directory: FilesystemDirectory.Cache,
        });
        await Share.share({
          title: t("settings.export_share"),
          text: t("settings.share_text"),
          files: [result.uri],
          dialogTitle: t("settings.share_save"),
        });
        setLastExportAt(Date.now());
        showToast(t("settings.exported"));
      } catch (error) {
        console.error("Error exporting data on native:", error);
        showToast(
          t("settings.export_fail"),
          "fa-exclamation-triangle",
          "var(--danger)",
        );
      }
      return;
    }

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setLastExportAt(Date.now());
    showToast(t("settings.exported"));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.transactions && Array.isArray(data.transactions)) {
          showConfirm(
            t("settings.confirm_import"),
            t("settings.confirm_import.body"),
            () => {
              importState({
                transactions: data.transactions,
                budgets: data.budgets || {},
                currency: data.currency || "$",
                showCalculator: data.showCalculator ?? true,
                showEUR: data.showEUR ?? false,
                showCustomRate: data.showCustomRate ?? false,
                customRate:
                  typeof data.customRate === "number" && data.customRate > 0
                    ? data.customRate
                    : null,
                language: data.language === "en" ? "en" : "es",
                pinHash:
                  typeof data.pinHash === "string" && data.pinHash
                    ? data.pinHash
                    : null,
                useBiometrics: data.useBiometrics ?? false,
                goals: Array.isArray(data.goals) ? data.goals : [],
                lastExportAt:
                  typeof data.lastExportAt === "number"
                    ? data.lastExportAt
                    : null,
                hasSeenTutorial: data.hasSeenTutorial ?? false,
              });
              showToast(t("settings.imported"));
            },
          );
        } else {
          showToast(
            t("settings.invalid_file"),
            "fa-circle-exclamation",
            "var(--danger)",
          );
        }
      } catch {
        showToast(
          t("settings.read_error"),
          "fa-circle-exclamation",
          "var(--danger)",
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleLoadSample = () => {
    showConfirm(
      t("settings.confirm_sample"),
      t("settings.confirm_sample.body"),
      () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();

        const d = (day: number) => {
          const maxDay = daysInMonth(y, m);
          return toISODate(new Date(y, m, Math.min(day, maxDay)));
        };
        const prevD = (day: number) => toISODate(new Date(y, m - 1, day));

        const sampleTxns: Transaction[] = [
          {
            id: generateId(),
            type: "income",
            amount: 4500,
            category: "salary",
            description: "Salario quincenal",
            date: d(1),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "income",
            amount: 800,
            category: "freelance",
            description: "Diseño landing page",
            date: d(5),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 45.5,
            category: "food",
            description: "Supermercado semanal",
            date: d(2),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 12,
            category: "transport",
            description: "Gasolina",
            date: d(3),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 89.99,
            category: "shopping",
            description: "Zapatillas nuevas",
            date: d(4),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 15,
            category: "entertainment",
            description: "Cine con amigos",
            date: d(6),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 35,
            category: "health",
            description: "Farmacia",
            date: d(7),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 29.99,
            category: "education",
            description: "Curso Udemy",
            date: d(8),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 120,
            category: "home",
            description: "Limpieza profunda",
            date: d(9),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 55,
            category: "services",
            description: "Internet mensual",
            date: d(10),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 8.5,
            category: "food",
            description: "Café y pan",
            date: d(11),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 22,
            category: "food",
            description: "Almuerzo equipo",
            date: d(12),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "income",
            amount: 50,
            category: "gift",
            description: "Cumpleaños abuela",
            date: d(14),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 38,
            category: "transport",
            description: "Uber semana",
            date: d(15),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "income",
            amount: 4500,
            category: "salary",
            description: "Salario quincenal",
            date: prevD(1),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 200,
            category: "food",
            description: "Compras mes",
            date: prevD(5),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 60,
            category: "services",
            description: "Servicios varios",
            date: prevD(10),
            createdAt: Date.now(),
          },
          {
            id: generateId(),
            type: "expense",
            amount: 120,
            category: "shopping",
            description: "Ropa",
            date: prevD(15),
            createdAt: Date.now(),
          },
        ];

        const sampleBudgets: Record<string, number> = {
          food: 300,
          transport: 100,
          shopping: 150,
          entertainment: 80,
          health: 60,
          education: 50,
          home: 150,
          services: 70,
        };

        importState({
          transactions: sampleTxns,
          budgets: sampleBudgets,
          currency: "$",
          showCalculator: true,
          showEUR: true,
          showCustomRate: false,
          customRate: null,
          language,
          pinHash: null,
          useBiometrics: false,
          goals: [],
          lastExportAt: null,
          hasSeenTutorial: false,
        });
        showToast(t("settings.sample_loaded"));
      },
    );
  };

  const handleClearAll = () => {
    showConfirm(
      t("settings.confirm_clear"),
      t("settings.confirm_clear.body"),
      () => {
        importState({
          transactions: [],
          budgets: {},
          currency: "$",
          showCalculator: true,
          showEUR: false,
          showCustomRate: false,
          customRate: null,
          language,
          pinHash: null,
          useBiometrics: false,
          goals: [],
          lastExportAt: null,
          hasSeenTutorial: false,
        });
        showToast(t("settings.data_cleared"), "fa-trash", "var(--danger)");
      },
    );
  };

  const handlePinToggle = (checked: boolean) => {
    if (checked) {
      setPinModalOpen(true);
    } else {
      showConfirm(
        t("settings.pin_lock"),
        t("settings.pin_confirm.body"),
        () => {
          setPinHash(null);
          setUseBiometrics(false);
          showToast(t("lock.disabled"), "fa-lock-open");
        },
        {
          confirmLabel: t("confirm.ok"),
          cancelLabel: t("confirm.cancel"),
        },
      );
    }
  };

  const handleBiometricToggle = async (checked: boolean) => {
    if (bioBusy) return;
    if (!Capacitor.isNativePlatform()) {
      showToast(
        t("settings.biometric_unsupported"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }
    setBioBusy(true);
    try {
      const result = await NativeBiometric.isAvailable({ useFallback: false });
      if (!result.isAvailable) {
        showToast(
          t("settings.biometric_unsupported"),
          "fa-circle-exclamation",
          "var(--danger)",
        );
        return;
      }
      setUseBiometrics(checked);
    } catch (error) {
      console.error("Biometric availability check failed:", error);
      showToast(
        t("settings.biometric_unsupported"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
    } finally {
      setBioBusy(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">{t("settings.title")}</h1>
      </header>

      {/* Info */}
      <section
        className="glass-card"
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div className="profile-icon">
          <img
            src={fLogo}
            alt=""
            style={{ width: 36, height: 36, display: "block" }}
            draggable={false}
          />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>
            {t("settings.app_name")}
          </h3>
          <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            v{version}
          </p>
        </div>
      </section>

      {/* Idioma */}
      <section
        id="settings-language"
        className="glass-card"
        style={{ marginBottom: 12 }}
      >
        <label className="field-label">{t("settings.language")}</label>
        <CustomSelect
          value={language}
          onChange={(value) => setLanguage(value === "en" ? "en" : "es")}
          options={[
            { value: "es", label: t("settings.language_es") },
            { value: "en", label: t("settings.language_en") },
          ]}
        />
      </section>

      {/* Moneda */}
      <section className="glass-card" style={{ marginBottom: 12 }}>
        <label className="field-label">{t("settings.currency")}</label>
        <CustomSelect
          value={currency}
          onChange={handleCurrencyChange}
          options={[
            { value: "$", label: t("settings.currency_usd") },
            { value: "€", label: t("settings.currency_eur") },
          ]}
        />
      </section>

      {/* Calculadora */}
      <section className="glass-card menu-list" style={{ marginBottom: 12 }}>
        <div className="menu-item" style={{ cursor: "pointer" }}>
          <i className="fa-solid fa-calculator menu-icon" />
          <span style={{ flex: 1 }}>{t("settings.show_calculator")}</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={showCalculator}
              onChange={(e) => setShowCalculator(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
      </section>

      {/* Configuración de tasas */}
      <section
        className="glass-card menu-list"
        id="settings-rates"
        style={{ marginBottom: 12 }}
      >
        <div
          className="menu-item"
          style={{ cursor: "pointer" }}
          onClick={() => setRatesOpen((prev) => !prev)}
        >
          <i className="fa-solid fa-coins menu-icon" />
          <span style={{ flex: 1 }}>{t("settings.rates")}</span>
          <i
            className={`fa-solid fa-chevron-down ${ratesOpen ? "rotate-180" : ""}`}
            style={{ fontSize: 12, color: "var(--fg-muted)", transition: "transform 0.25s" }}
          />
        </div>

        {ratesOpen && (
          <div style={{ paddingBottom: 8 }}>
            <div className="menu-item" style={{ cursor: "pointer" }}>
              <i className="fa-solid fa-euro-sign menu-icon" />
              <span style={{ flex: 1 }}>{t("settings.show_eur")}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showEUR}
                  onChange={(e) => setShowEUR(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
            <p className="settingsTextDescription">
              {t("settings.eur_hint")}
            </p>

            <div className="menu-item" style={{ cursor: "pointer" }}>
              <i className="fa-solid fa-sliders menu-icon" />
              <span style={{ flex: 1 }}>{t("settings.show_custom")}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showCustomRate}
                  onChange={(e) => setShowCustomRate(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
            {showCustomRate && (
              <div className="custom-rate-input-container">
                <input
                  type="text"
                  inputMode="decimal"
                  className="input-field custom-rate-input"
                  value={customDraft}
                  onChange={(e) => {
                    const sanitized = sanitizeAmount(e.target.value);
                    if (sanitized === "" && e.target.value !== "") return;
                    setCustomDraft(sanitized);
                  }}
                  placeholder={
                    customRate !== null
                      ? String(customRate)
                      : t("settings.custom_placeholder")
                  }
                  aria-label={t("settings.custom_enter")}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={handleSaveCustomRate}
                  title={t("calc.custom_save")}
                  aria-label={t("calc.custom_save_aria")}
                >
                  <i className="fa-solid fa-check" />
                </button>
                {customRate !== null && (
                  <button
                    type="button"
                    className="icon-btn icon-btn-danger"
                    onClick={handleClearCustomRate}
                    title={t("calc.custom_delete")}
                    aria-label={t("calc.custom_delete_aria")}
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                )}
              </div>
            )}
            <p className="settingsTextDescription">
              {t("settings.custom_hint")}
            </p>
          </div>
        )}
      </section>

      {/* Seguridad */}
      <section
        className="glass-card menu-list"
        id="settings-security"
        style={{ marginBottom: 12 }}
      >
        <div className="menu-item" style={{ cursor: "pointer" }}>
          <i className="fa-solid fa-lock menu-icon" />
          <span style={{ flex: 1 }}>{t("settings.pin_lock")}</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={pinHash !== null}
              onChange={(e) => handlePinToggle(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <p className="settingsTextDescription">{t("settings.pin_hint")}</p>

        <div
          className="menu-item"
          style={{ cursor: "pointer", opacity: pinHash ? 1 : 0.4 }}
        >
          <i className="fa-solid fa-fingerprint menu-icon" />
          <span style={{ flex: 1 }}>{t("settings.biometric")}</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={useBiometrics}
              disabled={pinHash === null}
              onChange={(e) => handleBiometricToggle(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <p className="settingsTextDescription">{t("settings.biometric_hint")}</p>
      </section>

      {/* Ayuda */}
      <section className="glass-card menu-list" style={{ marginBottom: 12 }}>
        <div
          className="menu-item"
          onClick={() =>
            startTutorial(navigateTo, openTransactionModal, closeTransactionModal)
          }
          aria-label={t("settings.tutorial")}
        >
          <i className="fa-solid fa-circle-question menu-icon" />
          <span style={{ flex: 1 }}>{t("settings.tutorial")}</span>
          <i
            className="fa-solid fa-chevron-right"
            style={{ fontSize: 12, color: "var(--fg-muted)" }}
          />
        </div>
        <p className="settingsTextDescription">{t("settings.tutorial_hint")}</p>
      </section>

      {/* Acciones */}
      <section
        className="glass-card menu-list"
        id="settings-actions"
        style={{ marginBottom: 12 }}
      >
        <div className="menu-item" onClick={handleExport}>
          <i className="fa-solid fa-file-export menu-icon" />
          <span style={{ flex: 1 }}>{t("settings.export")}</span>
          <i
            className="fa-solid fa-chevron-right"
            style={{ fontSize: 12, color: "var(--fg-muted)" }}
          />
        </div>
        <div className="menu-item" onClick={() => fileRef.current?.click()}>
          <i className="fa-solid fa-file-import menu-icon" />
          <span style={{ flex: 1 }}>{t("settings.import")}</span>
          <i
            className="fa-solid fa-chevron-right"
            style={{ fontSize: 12, color: "var(--fg-muted)" }}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleImport}
        />
        <div className="menu-item" onClick={handleLoadSample}>
          <i className="fa-solid fa-database menu-icon" />
          <span style={{ flex: 1 }}>{t("settings.load_sample")}</span>
          <i
            className="fa-solid fa-chevron-right"
            style={{ fontSize: 12, color: "var(--fg-muted)" }}
          />
        </div>
      </section>

      {/* Danger */}
      <section className="glass-card menu-list danger-list">
        <div className="menu-item" onClick={handleClearAll}>
          <i
            className="fa-solid fa-trash"
            style={{
              fontSize: 16,
              color: "var(--danger)",
              width: 24,
              textAlign: "center",
            }}
          />
          <span style={{ flex: 1, color: "var(--danger)" }}>
            {t("settings.clear_all")}
          </span>
        </div>
      </section>

      <footer className="footer-note">
        <p>{t("settings.storage_note")}</p>
      </footer>

      {pinModalOpen && <PinModal onClose={() => setPinModalOpen(false)} />}
    </div>
  );
}
