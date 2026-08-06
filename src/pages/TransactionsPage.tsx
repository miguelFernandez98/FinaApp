import { useState, useMemo, useEffect } from "react";
import { useApp } from "../AppContext";
import { MONTH_NAMES, parseISODate } from "../utils/date";
import { formatMoney } from "../utils/format";
import {
  getCategoryById,
  getMonthTransactionsWithDebtCarry,
  getFutureTransactions,
} from "../utils/transactions";
import TransactionModal from "../components/TransactionModal";
import TransactionItem from "../components/TransactionItem";
import type { Transaction, FilterType } from "../types";

export default function TransactionsPage() {
  const {
    transactions,
    currentMonth,
    currentYear,
    currency,
    currentTypeFilter,
    currentCategoryFilter,
    setFilter,
    setCategoryFilter,
    changeMonth,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const visibleTransactions = useMemo(() => {
    if (currentTypeFilter === "future") {
      return getFutureTransactions(transactions);
    }
    return getMonthTransactionsWithDebtCarry(
      transactions,
      currentMonth,
      currentYear,
    );
  }, [transactions, currentMonth, currentYear, currentTypeFilter]);

  const usedCats = useMemo(
    () => [...new Set(visibleTransactions.map((t) => t.category))],
    [visibleTransactions],
  );

  const filtered = useMemo(() => {
    let result = visibleTransactions;
    if (currentTypeFilter !== "all" && currentTypeFilter !== "future")
      result = result.filter((t) => t.type === currentTypeFilter);
    if (currentCategoryFilter !== "all")
      result = result.filter((t) => t.category === currentCategoryFilter);
    return result.sort(
      (a, b) => parseISODate(b.date).getTime() - parseISODate(a.date).getTime(),
    );
  }, [visibleTransactions, currentTypeFilter, currentCategoryFilter]);

  // Agrupar por fecha
  const transactionsByDate = useMemo(() => {
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
      {currentTypeFilter !== "future" && (
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
      )}

      {/* Filtros de tipo */}
      <div className="filters-scroll">
        {(["all", "expense", "income", "debt", "future"] as FilterType[]).map(
          (f) => (
            <button
              key={f}
              className={`filter-chip ${currentTypeFilter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all"
                ? "Todos"
                : f === "expense"
                  ? "Gastos"
                  : f === "income"
                    ? "Ingresos"
                    : f === "debt"
                      ? "Deudas"
                      : "Futuros"}
            </button>
          ),
        )}
      </div>

      {/* Filtros de categoría */}
      <div className="filters-scroll" style={{ marginBottom: 20 }}>
        <button
          className={`filter-chip ${currentCategoryFilter === "all" ? "active" : ""}`}
          onClick={() => setCategoryFilter("all")}
        >
          Todas
        </button>
        {usedCats.map((id) => {
          const cat = getCategoryById(id);
          return (
            <button
              key={id}
              className={`filter-chip ${currentCategoryFilter === id ? "active" : ""}`}
              onClick={() => setCategoryFilter(id)}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Lista agrupada */}
      {transactionsByDate.length === 0 ? (
        <div className="empty-state">
          <i
            className={
              currentTypeFilter === "future"
                ? "fa-solid fa-calendar-plus"
                : "fa-solid fa-filter"
            }
          />
          <p style={{ fontSize: 13 }}>
            {currentTypeFilter === "future"
              ? "No hay movimientos futuros"
              : "Sin resultados para este filtro"}
          </p>
        </div>
      ) : (
        transactionsByDate.map(([date, items]) => {
          const dayTotal = items.reduce(
            (s, t) => s + (t.type === "expense" ? -t.amount : t.amount),
            0,
          );
          const d = parseISODate(date);
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
