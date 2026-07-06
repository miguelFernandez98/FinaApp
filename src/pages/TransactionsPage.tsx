import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context";
import { MONTH_NAMES } from "../data/categories";
import {
  formatMoney,
  getCatById,
  getMonthTransactionsWithDebtCarry,
} from "../utils/helpers";
import TransactionModal from "../components/TransactionModal";
import TransactionItem from "../components/TransactionItem";
import type { Transaction, FilterType } from "../types";

export default function TransactionsPage() {
  const {
    transactions,
    currentMonth,
    currentYear,
    currency,
    currentFilter,
    currentCatFilter,
    setFilter,
    setCatFilter,
    changeMonth,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const txns = useMemo(
    () =>
      getMonthTransactionsWithDebtCarry(
        transactions,
        currentMonth,
        currentYear,
      ),
    [transactions, currentMonth, currentYear],
  );

  const usedCats = useMemo(
    () => [...new Set(txns.map((t) => t.category))],
    [txns],
  );

  const filtered = useMemo(() => {
    let result = txns;
    if (currentFilter !== "all")
      result = result.filter((t) => t.type === currentFilter);
    if (currentCatFilter !== "all")
      result = result.filter((t) => t.category === currentCatFilter);
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [txns, currentFilter, currentCatFilter]);

  // Agrupar por fecha
  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

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
      btn.onclick = null;
    }
  }, []);

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 20 }}>
        Movimientos
      </h1>

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

      {/* Filtros de tipo */}
      <div className="filters-scroll">
        {(["all", "expense", "income", "debt"] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`filter-chip ${currentFilter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all"
              ? "Todos"
              : f === "expense"
                ? "Gastos"
                : f === "income"
                  ? "Ingresos"
                  : "Deudas"}
          </button>
        ))}
      </div>

      {/* Filtros de categoría */}
      <div className="filters-scroll" style={{ marginBottom: 20 }}>
        <button
          className={`filter-chip ${currentCatFilter === "all" ? "active" : ""}`}
          onClick={() => setCatFilter("all")}
        >
          Todas
        </button>
        {usedCats.map((id) => {
          const cat = getCatById(id);
          return (
            <button
              key={id}
              className={`filter-chip ${currentCatFilter === id ? "active" : ""}`}
              onClick={() => setCatFilter(id)}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Lista agrupada */}
      {grouped.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-filter" />
          <p style={{ fontSize: 13 }}>Sin resultados para este filtro</p>
        </div>
      ) : (
        grouped.map(([date, items]) => {
          const dayTotal = items.reduce(
            (s, t) => s + (t.type === "expense" ? -t.amount : t.amount),
            0,
          );
          const d = new Date(date);
          const dateLabel = d.toLocaleDateString("es", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });

          return (
            <div key={date}>
              <div className="date-header">
                <span style={{ textTransform: "capitalize" }}>{dateLabel}</span>
                <span
                  style={{
                    color: dayTotal >= 0 ? "var(--success)" : "var(--danger)",
                  }}
                >
                  {dayTotal >= 0 ? "+" : ""}
                  {formatMoney(dayTotal, currency)}
                </span>
              </div>
              <div className="glass-card" style={{ padding: "4px 14px" }}>
                {items.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onEdit={() => {
                      setEditingId(t.recurringId ?? t.id);
                      setModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

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
