import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context";
import { MONTH_NAMES } from "../data/categories";
import {
  formatMoney,
  getCatById,
  getGreeting,
  calculatePreviousBalance,
  calculateMonthDebtAmount,
  getPendingDebtsForMonth,
  parseISODate,
} from "../utils/helpers";
import TransactionModal from "../components/TransactionModal";
import TransactionItem from "../components/TransactionItem";
import DonutChart from "../components/DonutChart";
import CurrencyCalculator from "../components/CurrencyCalculator";
import { fetchBinanceRate, fetchBCVRate } from "../utils/exchangeRates";
//import type { Transaction } from "../types";

export default function HomePage() {
  const {
    transactions,
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
  const previousBalance = useMemo(
    () => calculatePreviousBalance(transactions, currentMonth, currentYear),
    [transactions, currentMonth, currentYear],
  );
  const debtAmount = useMemo(
    () => calculateMonthDebtAmount(transactions, currentMonth, currentYear),
    [transactions, currentMonth, currentYear],
  );
  const balance = previousBalance + income - expense - debtAmount;
  const pendingDebts = useMemo(
    () => getPendingDebtsForMonth(transactions, currentMonth, currentYear),
    [transactions, currentMonth, currentYear],
  );
  const pendingDebtsTotal = useMemo(
    () =>
      pendingDebts.reduce(
        (sum, t) =>
          sum + (t.debtPaidAmount ? t.amount - t.debtPaidAmount : t.amount),
        0,
      ),
    [pendingDebts],
  );

  const recent = useMemo(
    () =>
      [...txns]
        .sort(
          (a, b) => parseISODate(b.date).getTime() - parseISODate(a.date).getTime(),
        )
        .slice(0, 5),
    [txns],
  );

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

  useEffect(() => {
    const testAPIs = async () => {
      try {
        const binanceRate = await fetchBinanceRate();
        console.log("Binance rate:", binanceRate);
      } catch (error) {
        console.error("Binance error:", error);
      }
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

      {previousBalance !== 0 && (
        <div className="previous-balance-row">
          <div>
            <i className="fa-solid fa-arrow-up-right-dots" /> Saldo anterior
          </div>
          <div
            style={{
              color: previousBalance >= 0 ? "var(--success)" : "var(--danger)",
            }}
          >
            {previousBalance < 0 ? "-" : ""}
            {formatMoney(previousBalance, currency)}
          </div>
        </div>
      )}

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

      {pendingDebts.length > 0 && (
        <div className="glass-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Deudas pendientes</h3>
              <span className="card-subtitle">
                Vence {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
            </div>
            <div
              style={{
                color: "var(--danger)",
                fontWeight: 700,
                textAlign: "right",
              }}
            >
              {formatMoney(pendingDebtsTotal, currency)}
            </div>
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
            {pendingDebts.slice(0, 3).map((debt) => (
              <div
                key={debt.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {getCatById(debt.category).name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                    {debt.debtDueDate
                      ? `Límite: ${debt.debtDueDate}`
                      : "Sin fecha límite"}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {formatMoney(
                    debt.debtPaidAmount
                      ? debt.amount - debt.debtPaidAmount
                      : debt.amount,
                    currency,
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <TransactionItem
              key={t.id}
              transaction={t}
              onEdit={() => {
                setEditingId(t.recurringId ?? t.id);
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
