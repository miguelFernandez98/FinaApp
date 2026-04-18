import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context";
import { MONTH_NAMES } from "../data/categories";
import { formatMoney, getCatById } from "../utils/helpers";
import BarChart from "../components/BarChart";
import BudgetModal from "../components/BudgetModal";

export default function StatsPage() {
  const { getMonthTransactions, currentMonth, currentYear, currency, budgets } =
    useApp();
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

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

  // Top categorías
  const topCats = useMemo(() => {
    const expenses = txns.filter((t) => t.type === "expense");
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
  }, [txns]);

  // Presupuestos
  const budgetItems = useMemo(() => {
    const expenses = txns.filter((t) => t.type === "expense");
    return Object.entries(budgets)
      .filter(([, budget]) => budget > 0)
      .map(([id, budget]) => {
        const spent = expenses
          .filter((t) => t.category === id)
          .reduce((s, t) => s + t.amount, 0);
        const pct = Math.min((spent / budget) * 100, 100);
        const over = spent > budget;
        const cat = getCatById(id);
        return { id, budget, spent, pct, over, cat };
      });
  }, [txns, budgets]);

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 20 }}>
        Estadísticas
      </h1>

      {/* Resumen */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <div className="stats-grid">
          <div className="stat-mini">
            <div className="stat-value" style={{ color: "var(--accent)" }}>
              {balance < 0 ? "-" : ""}
              {formatMoney(balance, currency)}
            </div>
            <div className="stat-label">Balance</div>
          </div>
          <div className="stat-mini">
            <div className="stat-value" style={{ color: "var(--success)" }}>
              {formatMoney(income, currency)}
            </div>
            <div className="stat-label">Ingresos</div>
          </div>
          <div className="stat-mini">
            <div className="stat-value" style={{ color: "var(--danger)" }}>
              {formatMoney(expense, currency)}
            </div>
            <div className="stat-label">Gastos</div>
          </div>
        </div>
      </div>

      {/* Barras */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 12 }}>
          Tendencia mensual
        </h3>
        <div style={{ height: 200 }}>
          <BarChart />
        </div>
      </div>

      {/* Presupuestos */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title">Presupuestos</h3>
          <span
            className="section-link"
            onClick={() => setBudgetModalOpen(true)}
          >
            Editar
          </span>
        </div>
        {budgetItems.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 20,
              color: "var(--fg-muted)",
            }}
          >
            <p style={{ fontSize: 13 }}>Sin presupuestos configurados</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Toca "Editar" para definirlos
            </p>
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
                  Excedido por {formatMoney(item.spent - item.budget, currency)}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Top categorías */}
      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>
          Top gastos del mes
        </h3>
        {topCats.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "var(--fg-muted)",
              padding: 16,
            }}
          >
            Sin gastos este mes
          </p>
        ) : (
          topCats.map((item, idx) => (
            <div
              key={item.id}
              className={`top-cat-row ${idx < topCats.length - 1 ? "bordered" : ""}`}
            >
              <div
                className="top-cat-icon"
                style={{
                  background: `${getCatById(item.id).color}20`,
                  color: getCatById(item.id).color,
                }}
              >
                <i className={`fa-solid ${getCatById(item.id).icon}`} />
              </div>
              <div className="top-cat-info">
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {getCatById(item.id).name}
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                  {item.pct}% del total
                </div>
              </div>
              <div className="top-cat-amount">
                -{formatMoney(item.amount, currency)}
              </div>
            </div>
          ))
        )}
      </div>

      {budgetModalOpen && (
        <BudgetModal onClose={() => setBudgetModalOpen(false)} />
      )}
    </div>
  );
}
