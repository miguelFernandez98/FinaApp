import { useState, useMemo, useEffect } from "react";
import { useAppData, useAppUI, useAppActions } from "../AppContext";
import { t, useI18n } from "../i18n";
import { parseISODate } from "../utils/date";
import { formatMoney } from "../utils/format";
import {
  getCategoryById,
  getMonthTransactionsWithDebtCarry,
  getFutureTransactions,
  sortByDateDesc,
} from "../utils/transactions";
import TransactionItem from "../components/TransactionItem";
import MonthSelector from "../components/MonthSelector";
import AppVersion from "../components/AppVersion";
import type { Transaction, FilterType } from "../types";

export default function TransactionsPage() {
  const { transactions, currency } = useAppData();
  const {
    currentMonth,
    currentYear,
    currentTypeFilter,
    currentCategoryFilter,
  } = useAppUI();
  const { setFilter, setCategoryFilter, openTransactionModal } =
    useAppActions();
  const { language } = useI18n();

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
    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          getCategoryById(t.category).name.toLowerCase().includes(q),
      );
    }
    return sortByDateDesc(result, newestFirst ? 1 : -1);
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
          {t("tx.title")} <AppVersion />
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`sort-btn ${searchOpen ? "active" : ""}`}
            id="txn-search-btn"
            onClick={() => {
              if (searchOpen) setSearchQuery("");
              setSearchOpen((prev) => !prev);
            }}
            aria-label={
              searchOpen ? t("tx.search_close") : t("tx.search")
            }
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button
            className="sort-btn"
            onClick={() => setNewestFirst((prev) => !prev)}
            aria-label={
              newestFirst
                ? t("tx.sort_oldest_first")
                : t("tx.sort_newest_first")
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
            placeholder={t("tx.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery !== "" && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery("")}
              aria-label={t("tx.clear_search")}
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
                ? t("tx.all")
                : f === "expense"
                  ? t("tx.expense")
                  : f === "income"
                    ? t("tx.income")
                    : f === "debt"
                      ? t("tx.debt")
                      : t("tx.future")}
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
          {t("tx.all_cats")}
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

      {/* Limpiar filtros */}
      {(currentTypeFilter !== "all" ||
        currentCategoryFilter !== "all" ||
        searchQuery.trim() !== "") && (
        <div style={{ marginBottom: 20 }}>
          <button
            className="clear-filters-btn"
            onClick={() => {
              setFilter("all");
              setCategoryFilter("all");
              setSearchQuery("");
            }}
          >
            <i className="fa-solid fa-xmark" />
            {t("tx.clear_filters")}
          </button>
        </div>
      )}

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
          <div className="empty-state-title">
            {currentTypeFilter === "future"
              ? t("tx.future_empty")
              : searchQuery.trim() !== "" ||
                  currentCategoryFilter !== "all" ||
                  currentTypeFilter !== "all"
                ? t("tx.filter_empty")
                : t("tx.month_empty")}
          </div>
          {currentTypeFilter === "future" ? (
            <p>{t("tx.future_empty.body")}</p>
          ) : searchQuery.trim() !== "" ||
            currentCategoryFilter !== "all" ||
            currentTypeFilter !== "all" ? (
            <p>{t("tx.filter_empty.body")}</p>
          ) : (
            <p>{t("tx.month_empty.body")}</p>
          )}
        </div>
      ) : (
        transactionsByDate.map(([date, items]) => {
          const dayTotal = items.reduce(
            (s, t) => s + (t.type === "expense" ? -t.amount : t.amount),
            0,
          );
          const d = parseISODate(date);
          const locale = language === "en" ? "en" : "es";
          const dateLabel = d.toLocaleDateString(locale, {
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
