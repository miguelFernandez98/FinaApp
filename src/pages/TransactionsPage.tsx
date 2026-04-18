import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context";
import { MONTH_NAMES } from "../data/categories";
import { formatMoney, getCatById } from "../utils/helpers";
import TransactionModal from "../components/TransactionModal";
import type { Transaction, FilterType } from "../types";

export default function TransactionsPage() {
  const {
    getMonthTransactions,
    currentMonth,
    currentYear,
    currency,
    currentFilter,
    currentCatFilter,
    setFilter,
    setCatFilter,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const txns = useMemo(
    () => getMonthTransactions(currentMonth, currentYear),
    [getMonthTransactions, currentMonth, currentYear],
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

      {/* Filtros de tipo */}
      <div className="filters-scroll">
        {(["all", "expense", "income"] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`filter-chip ${currentFilter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todos" : f === "expense" ? "Gastos" : "Ingresos"}
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
                  <div
                    key={t.id}
                    className="txn-item"
                    onClick={() => {
                      setEditingId(t.id);
                      setModalOpen(true);
                    }}
                  >
                    <div
                      className="txn-icon"
                      style={{
                        background:
                          t.type === "income"
                            ? "var(--success-dim)"
                            : `${getCatById(t.category).color}18`,
                        color: getCatById(t.category).color,
                      }}
                    >
                      <i
                        className={`fa-solid ${getCatById(t.category).icon}`}
                      />
                    </div>
                    <div className="txn-info">
                      <div className="txn-desc">
                        {t.description || getCatById(t.category).name}
                      </div>
                      <div className="txn-meta">
                        {getCatById(t.category).name} ·{" "}
                        {new Date(t.date).toLocaleDateString("es", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>
                    <div
                      className="txn-amount"
                      style={{
                        color:
                          t.type === "income"
                            ? "var(--success)"
                            : "var(--danger)",
                      }}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatMoney(t.amount, currency)}
                    </div>
                  </div>
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
