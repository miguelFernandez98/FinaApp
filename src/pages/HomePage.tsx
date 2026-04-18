import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context";
import { MONTH_NAMES } from "../data/categories";
import { formatMoney, getCatById, getGreeting } from "../utils/helpers";
import TransactionModal from "../components/TransactionModal";
import DonutChart from "../components/DonutChart";
import CurrencyCalculator from "../components/CurrencyCalculator";
import { fetchBinanceRate, fetchBCVRate } from "../utils/exchangeRates";
import type { Transaction } from "../types";

export default function HomePage() {
  const {
    getMonthTransactions,
    currentMonth,
    currentYear,
    currency,
    changeMonth,
  } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const txns = useMemo(
    () => getMonthTransactions(currentMonth, currentYear),
    [getMonthTransactions, currentMonth, currentYear],
  );

  const income = useMemo(
    () =>
      txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [txns],
  );
  const expense = useMemo(
    () =>
      txns
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [txns],
  );
  const balance = income - expense;

  const recent = useMemo(
    () =>
      [...txns]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [txns],
  );

  // Escuchar el botón global de agregar
  useEffect(() => {
    const handler = () => {
      setEditingId(null);
      setModalOpen(true);
    };
    const btn = document.getElementById("global-add-btn");
    if (btn) {
      btn.addEventListener("click", handler);
      return () => btn.removeEventListener("click", handler);
    }
  }, []);

  // Limpiar el click del botón central para evitar doble navegación
  useEffect(() => {
    const btn = document.getElementById("global-add-btn");
    if (btn) {
      const original = btn.onclick;
      btn.onclick = null;
      return () => {
        if (original) btn.onclick = original;
      };
    }
  }, []);

  // Probar las APIs de exchange rates
  useEffect(() => {
    const testAPIs = async () => {
      console.log("Testing exchange rate APIs...");

      console.log("Testing Binance API...");
      try {
        const binanceRate = await fetchBinanceRate();
        console.log("Binance rate:", binanceRate);
      } catch (error) {
        console.error("Binance error:", error);
      }

      console.log("Testing BCV API...");
      try {
        const bcvRate = await fetchBCVRate();
        console.log("BCV rate:", bcvRate);
      } catch (error) {
        console.error("BCV error:", error);
      }
    };

    testAPIs();
  }, []);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="greeting-text">{getGreeting()}</p>
          <h1 className="page-title">Mi Finanzas</h1>
        </div>
        <div className="avatar-btn" onClick={() => {}}>
          <i
            className="fa-solid fa-user"
            style={{ fontSize: 14, color: "var(--fg-muted)" }}
          />
        </div>
      </div>

      {/* Selector de mes */}
      <div className="month-selector">
        <button className="month-arrow" onClick={() => changeMonth(-1)}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <span className="month-label">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <button className="month-arrow" onClick={() => changeMonth(1)}>
          <i className="fa-solid fa-chevron-right" />
        </button>
      </div>

      {/* Balance hero */}
      <div className="balance-hero">
        <p className="balance-label">Balance total</p>
        <div
          className="balance-amount"
          style={{ color: balance >= 0 ? "var(--accent)" : "var(--danger)" }}
        >
          {balance < 0 ? "-" : ""}
          {formatMoney(balance, currency)}
        </div>
        <div className="balance-row">
          <div className="balance-detail">
            <span className="balance-dot income" />
            <span className="balance-text">Ingresos</span>
            <span className="balance-value income">
              {formatMoney(income, currency)}
            </span>
          </div>
          <div className="balance-detail">
            <span className="balance-dot expense" />
            <span className="balance-text">Gastos</span>
            <span className="balance-value expense">
              {formatMoney(expense, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Calculadora de divisas */}
      <CurrencyCalculator />

      {/* Gráfico */}
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">Gastos por categoría</h3>
          <span className="card-subtitle">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
        </div>
        <div className="chart-container">
          <DonutChart transactions={txns} />
        </div>
      </div>

      {/* Recientes */}
      <div className="section-header">
        <h3 className="section-title">Recientes</h3>
        <span className="section-link">Ver todas</span>
      </div>

      <div className="glass-card">
        {recent.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-receipt" />
            <p style={{ fontSize: 13 }}>Aún no hay movimientos</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Toca + para agregar uno
            </p>
          </div>
        ) : (
          recent.map((t) => (
            <TxnItem
              key={t.id}
              t={t}
              onEdit={() => {
                setEditingId(t.id);
                setModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {modalOpen && (
        <TransactionModal
          editingId={editingId}
          onClose={() => {
            setModalOpen(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function TxnItem({ t, onEdit }: { t: Transaction; onEdit: () => void }) {
  const { currency } = useApp();
  const cat = getCatById(t.category);
  const sign = t.type === "income" ? "+" : "-";
  const color = t.type === "income" ? "var(--success)" : "var(--danger)";
  const bgColor = t.type === "income" ? "var(--success-dim)" : `${cat.color}18`;
  const dateStr = new Date(t.date).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="txn-item" onClick={onEdit}>
      <div
        className="txn-icon"
        style={{ background: bgColor, color: cat.color }}
      >
        <i className={`fa-solid ${cat.icon}`} />
      </div>
      <div className="txn-info">
        <div className="txn-desc">{t.description || cat.name}</div>
        <div className="txn-meta">
          {cat.name} · {dateStr}
        </div>
      </div>
      <div className="txn-amount" style={{ color }}>
        {sign}
        {formatMoney(t.amount, currency)}
      </div>
    </div>
  );
}
