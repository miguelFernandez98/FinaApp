import { useRef } from "react";
import { useApp } from "../context";
import { generateId, daysInMonth } from "../utils/helpers";
import { CATEGORIES, MONTH_NAMES } from "../data/categories";
import type { AppState, Transaction } from "../types";

export default function ProfilePage() {
  const {
    currency,
    setCurrency,
    transactions,
    budgets,
    showConfirm,
    showToast,
    replaceAllData,
  } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
    showToast("Moneda actualizada");
  };

  const handleExport = () => {
    const data = JSON.stringify({ transactions, budgets, currency }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finanzapp_backup_${new Date().toISOString().split("T")[0]}.json`;
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
              replaceAllData({
                transactions: data.transactions,
                budgets: data.budgets || {},
                currency: data.currency || "$",
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
          return new Date(y, m, Math.min(day, maxDay))
            .toISOString()
            .split("T")[0];
        };
        const prevD = (day: number) =>
          new Date(y, m - 1, day).toISOString().split("T")[0];

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

        replaceAllData({
          transactions: sampleTxns,
          budgets: sampleBudgets,
          currency: "$",
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
        replaceAllData({ transactions: [], budgets: {}, currency: "$" });
        showToast("Datos eliminados", "fa-trash", "var(--danger)");
      },
    );
  };

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        Configuración
      </h1>

      {/* Info */}
      <div
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
            v1.0 — Datos guardados localmente
          </p>
        </div>
      </div>

      {/* Moneda */}
      <div className="glass-card" style={{ marginBottom: 12 }}>
        <label className="field-label">Moneda</label>
        <select
          className="input-field"
          value={currency}
          onChange={handleCurrencyChange}
          style={{ cursor: "pointer" }}
        >
          <option value="$">$ USD — Dólar</option>
          <option value="€">€ EUR — Euro</option>
          <option value="£">£ GBP — Libra</option>
          <option value="MX$">MX$ — Peso Mexicano</option>
          <option value="COL$">COL$ — Peso Colombiano</option>
          <option value="S/">S/ — Sol Peruano</option>
          <option value="AR$">AR$ — Peso Argentino</option>
          <option value="R$">R$ — Real Brasileño</option>
        </select>
      </div>

      {/* Acciones */}
      <div className="glass-card menu-list" style={{ marginBottom: 12 }}>
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
      </div>

      {/* Danger */}
      <div className="glass-card menu-list danger-list">
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
      </div>

      <p className="footer-note">
        Los datos se almacenan exclusivamente en tu navegador.
      </p>
    </div>
  );
}
