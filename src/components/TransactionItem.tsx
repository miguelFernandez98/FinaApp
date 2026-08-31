import { memo, useState } from "react";
import { useAppData, useAppUI } from "../AppContext";
import { getLanguage, t, useI18n } from "../i18n";
import { parseISODate } from "../utils/date";
import { formatMoney, convertAmount } from "../utils/format";
import { getCategoryById } from "../utils/transactions";
import type { Transaction } from "../types";

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: () => void;
}

function TransactionItem({
  transaction,
  onEdit,
}: TransactionItemProps) {
  const { currency, equivalentRate, customRate } = useAppData();
  const { exchangeRates } = useAppUI();
  const [showBs, setShowBs] = useState(false);
  useI18n();
  const category = getCategoryById(transaction.category);
  const isDebt = transaction.type === "debt";
  const isPaidDebt = isDebt && transaction.debtStatus === "paid";
  const sign = transaction.type === "income" ? "+" : "-";
  const amountColor =
    transaction.type === "income" ? "var(--success)" : "var(--danger)";
  const iconBg =
    transaction.type === "income"
      ? "var(--success-dim)"
      : `${category.color}18`;
  const locale = getLanguage() === "en" ? "en" : "es";
  const dateStr = parseISODate(transaction.date).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });

  const equivRate =
    equivalentRate === "custom"
      ? customRate
      : equivalentRate === "parallel"
        ? exchangeRates.parallel
        : exchangeRates.bcv;

  const txnCurrency = transaction.currency ?? currency;

  const isRecurringTxn = transaction.isRecurring || !!transaction.recurringId;
  const badgeText = (() => {
    if (transaction.type !== "debt") {
      return isRecurringTxn ? t("item.recurring") : "";
    }
    if (!transaction.debtStatus) return "";
    if (transaction.debtStatus === "pending") return t("item.pending");
    if (transaction.debtStatus === "partial") {
      const paid = transaction.debtPaidAmount ?? 0;
      return t("item.partial", {
        paid: formatMoney(paid, currency),
        total: formatMoney(transaction.amount, currency),
      });
    }
    return t("item.paid");
  })();

  return (
    <article
      className="txn-item"
      onClick={onEdit}
      style={
        isPaidDebt ? { opacity: 0.55, textDecoration: "line-through" } : {}
      }
    >
      <div
        className="txn-icon"
        style={{ background: iconBg, color: category.color }}
      >
        <i className={`fa-solid ${category.icon}`} />
      </div>
      <div className="txn-info">
        <div className="txn-desc">
          {transaction.description || category.name}
        </div>
        <div className="txn-meta">
          {category.name} · {dateStr}
        </div>
        {badgeText && (
          <span
            className="txn-badge"
            style={{
              marginTop: 6,
              display: "inline-block",
              padding: "4px 8px",
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 700,
              color:
                transaction.debtStatus === "pending"
                  ? "var(--danger)"
                  : transaction.debtStatus === "partial"
                    ? "var(--warning)"
                    : "var(--fg-muted)",
              background:
                transaction.debtStatus === "pending"
                  ? "rgba(255, 92, 92, 0.1)"
                  : transaction.debtStatus === "partial"
                    ? "rgba(250, 204, 21, 0.14)"
                    : "rgba(255,255,255,0.06)",
            }}
          >
            {badgeText}
          </span>
        )}
      </div>
      <div
        className="txn-amount"
        style={{ color: amountColor, cursor: equivRate != null ? "pointer" : undefined }}
        onClick={(e) => {
          if (equivRate == null) return;
          e.stopPropagation();
          setShowBs((v) => !v);
        }}
      >
        {sign}
        {showBs && equivRate != null
          ? formatMoney(convertAmount(transaction.amount, txnCurrency, "Bs.", equivRate), "Bs.")
          : formatMoney(
              equivRate != null && equivRate > 0 && txnCurrency !== currency
                ? txnCurrency === "Bs."
                  ? transaction.amount / equivRate
                  : transaction.amount * equivRate
                : transaction.amount,
              currency,
            )}
      </div>
    </article>
  );
}

export default memo(TransactionItem);
