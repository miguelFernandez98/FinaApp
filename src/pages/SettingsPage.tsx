import { useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, FilesystemDirectory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { useApp } from "../AppContext";
import { generateId } from "../utils/transactions";
import { daysInMonth, toISODate } from "../utils/date";
import type { Transaction } from "../types";
import { version } from "../../package.json";
import CustomSelect from "../components/CustomSelect";

export default function SettingsPage() {
  const {
    currency,
    setCurrency,
    showCalculator,
    setShowCalculator,
    showEUR,
    setShowEUR,
    transactions,
    budgets,
    showConfirm,
    showToast,
    importState,
  } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    showToast("Moneda actualizada");
  };

  const handleExport = async () => {
    const data = JSON.stringify(
      { transactions, budgets, currency, showCalculator, showEUR },
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
          title: "Exportar datos",
          text: "Backup de FinanzApp",
          files: [result.uri],
          dialogTitle: "Guardar backup",
        });
        showToast("Datos exportados");
      } catch (error) {
        console.error("Error exporting data on native:", error);
        showToast(
          "No se pudo exportar",
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
    showToast("Datos exportados");
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
            "Importar datos",
            "Se reemplazarán todos los datos actuales.",
            () => {
              importState({
                transactions: data.transactions,
                budgets: data.budgets || {},
                currency: data.currency || "$",
                showCalculator: data.showCalculator ?? true,
                showEUR: data.showEUR ?? false,
              });
              showToast("Datos importados correctamente");
            },
          );
        } else {
          showToast(
            "Archivo no válido",
            "fa-circle-exclamation",
            "var(--danger)",
          );
        }
      } catch {
        showToast(
          "Error al leer el archivo",
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
      "Datos de ejemplo",
      "Se reemplazarán tus datos actuales.",
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
        });
        showToast("Datos de ejemplo cargados");
      },
    );
  };

  const handleClearAll = () => {
    showConfirm(
      "Borrar todo",
      "Se eliminarán todas las transacciones y presupuestos permanentemente.",
      () => {
        importState({
          transactions: [],
          budgets: {},
          currency: "$",
          showCalculator: true,
          showEUR: false,
        });
        showToast("Datos eliminados", "fa-trash", "var(--danger)");
      },
    );
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Configuración</h1>
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
          <i
            className="fa-solid fa-wallet"
            style={{ fontSize: 22, color: "var(--accent)" }}
          />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>FinanzApp</h3>
          <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            v{version}
          </p>
        </div>
      </section>

      {/* Moneda */}
      <section className="glass-card" style={{ marginBottom: 12 }}>
        <label className="field-label">Moneda</label>
        <CustomSelect
          value={currency}
          onChange={handleCurrencyChange}
          options={[
            { value: "$", label: "$ USD — Dólar" },
            { value: "€", label: "€ EUR — Euro" },
            { value: "£", label: "£ GBP — Libra" },
            { value: "MX$", label: "MX$ — Peso Mexicano" },
            { value: "COL$", label: "COL$ — Peso Colombiano" },
            { value: "S/", label: "S/ — Sol Peruano" },
            { value: "AR$", label: "AR$ — Peso Argentino" },
            { value: "R$", label: "R$ — Real Brasileño" },
          ]}
        />
      </section>

      {/* Calculadora */}
      <section className="glass-card menu-list" style={{ marginBottom: 12 }}>
        <div className="menu-item" style={{ cursor: "pointer" }}>
          <i className="fa-solid fa-calculator menu-icon" />
          <span style={{ flex: 1 }}>Mostrar calculadora de divisas</span>
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

      {/* Tasa Euro */}
      <section className="glass-card menu-list" style={{ marginBottom: 12 }}>
        <div className="menu-item" style={{ cursor: "pointer" }}>
          <i className="fa-solid fa-euro-sign menu-icon" />
          <span style={{ flex: 1 }}>Mostrar tasa Euro (EUR/VES)</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={showEUR}
              onChange={(e) => setShowEUR(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            padding: "0 16px 10px",
          }}
        >
          La tasa se actualiza junto con el dólar. Sin conexión se muestra la
          última guardada.
        </p>
      </section>

      {/* Acciones */}
      <section className="glass-card menu-list" style={{ marginBottom: 12 }}>
        <div className="menu-item" onClick={handleExport}>
          <i className="fa-solid fa-file-export menu-icon" />
          <span style={{ flex: 1 }}>Exportar datos</span>
          <i
            className="fa-solid fa-chevron-right"
            style={{ fontSize: 12, color: "var(--fg-muted)" }}
          />
        </div>
        <div className="menu-item" onClick={() => fileRef.current?.click()}>
          <i className="fa-solid fa-file-import menu-icon" />
          <span style={{ flex: 1 }}>Importar datos</span>
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
          <span style={{ flex: 1 }}>Cargar datos de ejemplo</span>
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
            Borrar todos los datos
          </span>
        </div>
      </section>

      <footer className="footer-note">
        <p>Los datos se almacenan exclusivamente en tu dispositivo.</p>
      </footer>
    </div>
  );
}
