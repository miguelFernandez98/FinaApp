import { useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { monthName, t, useI18n } from "../i18n";
import { parseISODate } from "../utils/date";
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
import GoalsModal from "../components/GoalsModal";
import fLogo from "../assets/f-logo.svg";

export default function HomePage() {
  const [donutType, setDonutType] = useState<"expense" | "income">("expense");
  const [goalsOpen, setGoalsOpen] = useState(false);
  useI18n();
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
    goals,
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
      <header className="page-header" id="home-header">
        <div>
          <p className="greeting-text">{getTimeBasedGreeting()}</p>
          <h1 className="page-title">
            {t("home.title")} <AppVersion />
          </h1>
        </div>
        <div className="avatar-btn" onClick={() => {}}>
          <img
            src={fLogo}
            alt=""
            style={{ width: 26, height: 26, display: "block" }}
            draggable={false}
          />
        </div>
      </header>

      {/* Selector de mes */}
      <MonthSelector />

      {previousBalance !== 0 && (
        <div className="previous-balance-row">
          <div>
            <i className="fa-solid fa-arrow-up-right-dots" />{" "}
            {t("home.previous_balance")}
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
      <section
        className="balance-hero"
        aria-label={t("home.aria.balance")}
      >
        <p className="balance-label">{t("home.balance")}</p>
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
            <span className="balance-text">{t("home.income")}</span>
            <span className="balance-value income">
              {formatMoney(income, currency)}
            </span>
          </div>
          <div className="balance-detail">
            <span className="balance-dot expense" />
            <span className="balance-text">{t("home.expense")}</span>
            <span className="balance-value expense">
              {formatMoney(expense, currency)}
            </span>
          </div>
        </div>
      </section>

      {/* Calculadora de divisas */}
      {showCalculator && <CurrencyCalculator />}

      <div className="home-grid">
        {pendingDebts.length > 0 && (
          <section
            className="glass-card"
            aria-label={t("home.aria.debts")}
          >
            <div className="card-header">
              <div>
                <h3 className="card-title">{t("home.debt_pending_total")}</h3>
                <span className="card-subtitle">
                  {t("home.debt_due", {
                    month: monthName(currentMonth),
                    year: currentYear,
                  })}
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
                        ? `${t("home.debt_limit", {
                            date: debt.debtDueDate,
                          })}`
                        : t("home.no_due_date")}
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
        <section
          className="glass-card"
          aria-label={t("home.aria.chart")}
        >
          <div className="card-header">
            <h3 className="card-title">
              {donutType === "expense"
                ? t("home.chart_expense")
                : t("home.chart_income")}
            </h3>
            <span className="card-subtitle">
              {monthName(currentMonth)} {currentYear}
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
                  {t("donut.expense")}
                </button>
                <button
                  className={`donut-type-btn ${
                    donutType === "income" ? "active-income" : ""
                  }`}
                  onClick={() => setDonutType("income")}
                >
                  {t("donut.income")}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Metas de ahorro */}
      <section
        id="goals-section"
        className="glass-card"
        aria-label={t("home.goals")}
      >
        <div className="card-header">
          <h3 className="card-title">{t("home.goals")}</h3>
          <span className="section-link" onClick={() => setGoalsOpen(true)}>
            {t("home.goals_manage")}
          </span>
        </div>
        {goals.length === 0 ? (
          <div className="empty-state" style={{ padding: "20px 16px" }}>
            <i className="fa-solid fa-piggy-bank" />
            <div className="empty-state-title">{t("home.goals_empty")}</div>
            <p>{t("home.goals_empty.body")}</p>
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => {
            const pct =
              goal.target > 0
                ? Math.min((goal.saved / goal.target) * 100, 100)
                : 0;
const done = goal.saved >= goal.target && goal.target > 0;
            return (
              <div key={goal.id} style={{ marginBottom: 14 }}>
                <div className="budget-header">
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {goal.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: done ? "var(--success)" : "var(--fg-muted)",
                    }}
                  >
                    {done && <i className="fa-solid fa-circle-check" />}{" "}
                    {formatMoney(goal.saved, currency)} /{" "}
                    {formatMoney(goal.target, currency)}
                  </span>
                </div>
                <div className="budget-bar-track">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: done ? "var(--success)" : "var(--accent)",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Recientes */}
      <div className="section-header">
        <h3 className="section-title">{t("home.recent")}</h3>
        <span
          className="section-link"
          onClick={() => {
            setFilter("all");
            setCategoryFilter("all");
            navigateTo("transactions");
          }}
        >
          {t("home.see_all")}
        </span>
      </div>

      <section className="glass-card" aria-label={t("home.aria.recent")}>
        {recent.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-receipt" />
            <div className="empty-state-title">{t("home.recent_empty")}</div>
            <p>{t("home.recent_empty.body")}</p>
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

      {goalsOpen && <GoalsModal onClose={() => setGoalsOpen(false)} />}
    </div>
  );
}
