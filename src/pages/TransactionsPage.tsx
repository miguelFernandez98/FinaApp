import { useState, useMemo, useEffect } from "react";
import { useApp } from "../AppContext";
import { parseISODate } from "../utils/date";
import { formatMoney } from "../utils/format";
import {
  getCategoryById,
  getMonthTransactionsWithDebtCarry,
  getFutureTransactions,
} from "../utils/transactions";
import TransactionItem from "../components/TransactionItem";
import MonthSelector from "../components/MonthSelector";
import AppVersion from "../components/AppVersion";
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
    openTransactionModal,
  } = useApp();

  const [newestFirst, setNewestFirst] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const usedCats = useMemo(() => {
    const typeFiltered =
      currentTypeFilter === "expense" ||
      currentTypeFilter === "income" ||
      currentTypeFilter === "debt"
        ? visibleTransactions.filter((t) => t.type === currentTypeFilter)
        : visibleTransactions;
    return [...new Set(typeFiltered.map((t) => t.category))];
  }, [visibleTransactions, currentTypeFilter]);

  useEffect(() => {
    if (
      currentCategoryFilter !== "all" &&
      !usedCats.includes(currentCategoryFilter)
    ) {
      setCategoryFilter("all");
    }
  }, [usedCats, currentCategoryFilter, setCategoryFilter]);

  const filtered = useMemo(() => {
    let result = visibleTransactions;
    if (currentTypeFilter !== "all" && currentTypeFilter !== "future")
      result = result.filter((t) => t.type === currentTypeFilter);
    if (currentCategoryFilter !== "all")
      result = result.filter((t) => t.category === currentCategoryFilter);
    if (searchQuery.trim() !== "")
      result = result.filter((t) =>
        t.description.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      );
    return result.sort((a, b) => {
      const dateDiff =
        (parseISODate(b.date).getTime() - parseISODate(a.date).getTime()) *
        (newestFirst ? 1 : -1);
      if (dateDiff !== 0) return dateDiff;
      return newestFirst ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
    });
  }, [
    visibleTransactions,
    currentTypeFilter,
    currentCategoryFilter,
    newestFirst,
    searchQuery,
  ]);

  // Agrupar por fecha
  const transactionsByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map).sort(([a], [b]) =>
      newestFirst ? b.localeCompare(a) : a.localeCompare(b),
    );
  }, [filtered, newestFirst]);

  return (
    <div className="page">
      <header className="page-header-row">
        <h1 className="page-title" style={{ marginBottom: 20 }}>
          Movimientos <AppVersion />
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`sort-btn ${searchOpen ? "active" : ""}`}
            onClick={() => {
              if (searchOpen) setSearchQuery("");
              setSearchOpen((prev) => !prev);
            }}
            aria-label={
              searchOpen ? "Cerrar búsqueda" : "Buscar por descripción"
            }
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button
            className="sort-btn"
            onClick={() => setNewestFirst((prev) => !prev)}
            aria-label={
              newestFirst
                ? "Ordenar de más antiguo a más nuevo"
                : "Ordenar de más nuevo a más antiguo"
            }
          >
            <i
              className={`fa-solid ${newestFirst ? "fa-arrow-down-wide-short" : "fa-arrow-up-short-wide"}`}
            />
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-bar" style={{ marginBottom: 12 }}>
          <i className="fa-solid fa-magnifying-glass" />
          <input
            autoFocus
            className="search-input"
            placeholder="Buscar por descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery !== "" && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      )}

      {/* Selector de mes */}
      {currentTypeFilter !== "future" && <MonthSelector />}

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
      <div className="cats-scroll" style={{ marginBottom: 20 }}>
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
              : searchQuery.trim() !== ""
                ? "Sin resultados para esta búsqueda"
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
              <section className="glass-card" style={{ padding: "4px 14px" }}>
                {items.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onEdit={() => openTransactionModal(t.recurringId ?? t.id)}
                  />
                ))}
              </section>
            </div>
          );
        })
      )}
    </div>
  );
}
