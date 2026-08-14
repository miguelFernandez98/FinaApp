import { useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { MONTH_NAMES, parseISODate } from "../utils/date";
import { formatMoney } from "../utils/format";
import {
  getCategoryById,
  getTimeBasedGreeting,
  calculatePreviousBalance,
  calculateMonthDebtAmount,
  getPendingDebtsForMonth,
} from "../utils/transactions";
import TransactionItem from "../components/TransactionItem";
import DonutChart from "../components/DonutChart";
import CurrencyCalculator from "../components/CurrencyCalculator";
import MonthSelector from "../components/MonthSelector";
import AppVersion from "../components/AppVersion";

export default function HomePage() {
  const [donutType, setDonutType] = useState<"expense" | "income">("expense");
  const {
    transactions,
    getMonthTransactions,
    currentMonth,
    currentYear,
    currency,
    navigateTo,
    setFilter,
    setCategoryFilter,
    showCalculator,
    openTransactionModal,
  } = useApp();

  const visibleTransactions = useMemo(
    () => getMonthTransactions(currentMonth, currentYear),
    [getMonthTransactions, currentMonth, currentYear],
  );

  const income = useMemo(
    () =>
      visibleTransactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [visibleTransactions],
  );
  const expense = useMemo(
    () =>
      visibleTransactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [visibleTransactions],
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
    () =>
      getPendingDebtsForMonth(transactions, currentMonth, currentYear).sort(
        (a, b) => {
          const dateDiff =
            parseISODate(b.date).getTime() - parseISODate(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return b.createdAt - a.createdAt;
        },
      ),
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
      [...visibleTransactions]
        .sort((a, b) => {
          const dateDiff =
            parseISODate(b.date).getTime() - parseISODate(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return b.createdAt - a.createdAt;
        })
        .slice(0, 5),
    [visibleTransactions],
  );

  return (
    <div className="page">
      {/* Header */}
      <header className="page-header">
        <div>
          <p className="greeting-text">{getTimeBasedGreeting()}</p>
          <h1 className="page-title">
            Mis Finanzas <AppVersion />
          </h1>
        </div>
        <div className="avatar-btn" onClick={() => {}}>
          <i
            className="fa-solid fa-user"
            style={{ fontSize: 14, color: "var(--fg-muted)" }}
          />
        </div>
      </header>

      {/* Selector de mes */}
      <MonthSelector />

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
      <section className="balance-hero" aria-label="Resumen del balance">
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
      </section>

      {/* Calculadora de divisas */}
      {showCalculator && <CurrencyCalculator />}

      {pendingDebts.length > 0 && (
        <section className="glass-card" aria-label="Deudas pendientes">
          <div className="card-header">
            <div>
              <h3 className="card-title">Deudas total pendiente</h3>
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
                    {getCategoryById(debt.category).name}
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
        </section>
      )}

      {/* Gráfico */}
      <section className="glass-card" aria-label="Distribución por categoría">
        <div className="card-header">
          <h3 className="card-title">
            {donutType === "expense"
              ? "Gastos por categoría"
              : "Ingresos por categoría"}
          </h3>
          <span className="card-subtitle">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
        </div>
        <div className="chart-container">
          <DonutChart transactions={visibleTransactions} type={donutType} />
          {(income > 0 || expense > 0) && (
            <div className="donut-type-toggle">
              <button
                className={`donut-type-btn ${
                  donutType === "expense" ? "active-expense" : ""
                }`}
                onClick={() => setDonutType("expense")}
              >
                Gastos
              </button>
              <button
                className={`donut-type-btn ${
                  donutType === "income" ? "active-income" : ""
                }`}
                onClick={() => setDonutType("income")}
              >
                Ingresos
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Recientes */}
      <div className="section-header">
        <h3 className="section-title">Recientes</h3>
        <span
          className="section-link"
          onClick={() => {
            setFilter("all");
            setCategoryFilter("all");
            navigateTo("transactions");
          }}
        >
          Ver todas
        </span>
      </div>

      <section className="glass-card" aria-label="Movimientos recientes">
        {recent.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-receipt" />
            <div className="empty-state-title">Aún no hay movimientos</div>
            <p>
              Registra tu primer ingreso o gasto para ver tu balance
              reflejado aquí.
            </p>
          </div>
        ) : (
          recent.map((t) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              onEdit={() => openTransactionModal(t.recurringId ?? t.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}
