import { useState, useMemo } from "react";
import { useApp } from "../AppContext";
import { t, useI18n } from "../i18n";
import { formatMoney } from "../utils/format";
import { getCategoryById } from "../utils/transactions";
import BarChart from "../components/BarChart";
import BudgetModal from "../components/BudgetModal";
import MonthSelector from "../components/MonthSelector";
import FinanceAdvisor from "../components/FinanceAdvisor";
import AppVersion from "../components/AppVersion";
import { exportTransactionsToCSV } from "../utils/export";

export default function StatsPage() {
  const {
    getMonthTransactions,
    currentMonth,
    currentYear,
    currency,
    budgets,
  } = useApp();
  useI18n();
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    const ok = await exportTransactionsToCSV(
      getMonthTransactions(currentMonth, currentYear),
      currency,
      currentMonth,
      currentYear,
    );
    setExporting(false);
    if (!ok) {
      alert(t("stats.export_error"));
    }
  };

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
  const balance = income - expense;

  // Top categorías
  const topCats = useMemo(() => {
    const expenses = visibleTransactions.filter((t) => t.type === "expense");
    const catMap: Record<string, number> = {};
    expenses.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const total = Object.values(catMap).reduce((s, v) => s + v, 0);
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({
        id,
        amount,
        pct: total > 0 ? ((amount / total) * 100).toFixed(1) : "0",
      }));
  }, [visibleTransactions]);

  // Presupuestos
  const budgetItems = useMemo(() => {
    const expenses = visibleTransactions.filter((t) => t.type === "expense");
    return Object.entries(budgets)
      .filter(([, budget]) => budget > 0)
      .map(([id, budget]) => {
        const spent = expenses
          .filter((t) => t.category === id)
          .reduce((s, t) => s + t.amount, 0);
        const pct = Math.min((spent / budget) * 100, 100);
        const over = spent > budget;
        const cat = getCategoryById(id);
        return { id, budget, spent, pct, over, cat };
      });
  }, [visibleTransactions, budgets]);

  return (
    <div className="page">
      <header className="page-header-row">
        <h1 className="page-title" style={{ marginBottom: 20 }}>
          {t("stats.title")} <AppVersion />
        </h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {/* Boton Asistente */}
          <button
            className="sort-btn advisor"
            onClick={() => setAdvisorOpen(true)}
            aria-label={t("stats.advisor")}
            title={t("stats.advisor")}
          >
            <i className="fa-solid fa-robot" />
          </button>
          {/* Boton exportar reporte */}
          <button
            className="sort-btn"
            onClick={handleExport}
            aria-label={t("stats.export")}
            title={t("stats.export")}
          >
            <i className="fa-solid fa-file-export" />
          </button>
        </div>
      </header>

      {/* Selector de mes */}
      <MonthSelector />

      {/* Resumen */}
      <section className="glass-card" style={{ marginBottom: 20 }}>
        <div className="stats-grid">
          <div className="stat-mini">
            <div className="stat-value" style={{ color: "var(--accent)" }}>
              {balance < 0 ? "-" : ""}
              {formatMoney(balance, currency)}
            </div>
            <div className="stat-label">{t("stats.balance")}</div>
          </div>
          <div className="stat-mini">
            <div className="stat-value" style={{ color: "var(--success)" }}>
              {formatMoney(income, currency)}
            </div>
            <div className="stat-label">{t("stats.income")}</div>
          </div>
          <div className="stat-mini">
            <div className="stat-value" style={{ color: "var(--danger)" }}>
              {formatMoney(expense, currency)}
            </div>
            <div className="stat-label">{t("stats.expense")}</div>
          </div>
        </div>
      </section>

      <div className="stats-main">
        {/* Barras */}
        <section className="glass-card">
          <h3 className="card-title" style={{ marginBottom: 12 }}>
            {t("stats.trend")}
          </h3>
          <div style={{ height: 200 }}>
            <BarChart />
          </div>
        </section>

        {/* Presupuestos */}
        <section className="glass-card">
          <div className="card-header">
            <h3 className="card-title">{t("stats.budgets")}</h3>
            <span
              className="section-link"
              onClick={() => setBudgetModalOpen(true)}
            >
              {t("stats.edit")}
            </span>
          </div>
          {budgetItems.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 16px" }}>
              <i className="fa-solid fa-bullseye" />
              <div className="empty-state-title">
                {t("stats.budgets_empty")}
              </div>
              <p>{t("stats.budgets_empty.body")}</p>
            </div>
          ) : (
            budgetItems.map((item) => (
              <div key={item.id} style={{ marginBottom: 14 }}>
                <div className="budget-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i
                      className={`fa-solid ${item.cat.icon}`}
                      style={{ fontSize: 12, color: item.cat.color }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      {item.cat.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: item.over ? "var(--danger)" : "var(--fg-muted)",
                    }}
                  >
                    {formatMoney(item.spent, currency)} /{" "}
                    {formatMoney(item.budget, currency)}
                  </span>
                </div>
                <div className="budget-bar-track">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${item.pct}%`,
                      background: item.over
                        ? "var(--danger)"
                        : item.pct > 75
                          ? "#fbbf24"
                          : item.cat.color,
                    }}
                  />
                </div>
                {item.over && (
                  <p
                    style={{ fontSize: 11, color: "var(--danger)", marginTop: 4 }}
                  >
                    {t("stats.over", {
                      amount: formatMoney(item.spent - item.budget, currency),
                    })}
                  </p>
                )}
              </div>
            ))
          )}
        </section>
      </div>

      {/* Top categorías */}
      <section className="glass-card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>
          {t("stats.top_cats")}
        </h3>
        {topCats.length === 0 ? (
          <div className="empty-state" style={{ padding: "24px 16px" }}>
            <i className="fa-solid fa-ranking-star" />
            <div className="empty-state-title">{t("stats.top_cats_empty")}</div>
            <p>{t("stats.top_cats_empty.body")}</p>
          </div>
        ) : (
          topCats.map((item, idx) => (
            <div
              key={item.id}
              className={`top-cat-row ${idx < topCats.length - 1 ? "bordered" : ""}`}
            >
              <div
                className="top-cat-icon"
                style={{
                  background: `${getCategoryById(item.id).color}20`,
                  color: getCategoryById(item.id).color,
                }}
              >
                <i className={`fa-solid ${getCategoryById(item.id).icon}`} />
              </div>
              <div className="top-cat-info">
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {getCategoryById(item.id).name}
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                  {t("stats.pct_of_total", { pct: item.pct })}
                </div>
              </div>
              <div className="top-cat-amount">
                -{formatMoney(item.amount, currency)}
              </div>
            </div>
          ))
        )}
      </section>

      {budgetModalOpen && (
        <BudgetModal onClose={() => setBudgetModalOpen(false)} />
      )}

      {advisorOpen && <FinanceAdvisor onClose={() => setAdvisorOpen(false)} />}
    </div>
  );
}
