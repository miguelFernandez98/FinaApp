import { useApp } from "../AppContext";
import { parseISODate } from "../utils/date";
import { formatMoney } from "../utils/format";
import { getCategoryById } from "../utils/transactions";
import type { Transaction } from "../types";

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: () => void;
}

export default function TransactionItem({
  transaction,
  onEdit,
}: TransactionItemProps) {
  const { currency } = useApp();
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
  const dateStr = parseISODate(transaction.date).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  });

  const isRecurringTxn = transaction.isRecurring || !!transaction.recurringId;
  const badgeText = (() => {
    if (transaction.type !== "debt") {
      return isRecurringTxn ? "Constante" : "";
    }
    if (!transaction.debtStatus) return "";
    if (transaction.debtStatus === "pending") return "Pendiente";
    if (transaction.debtStatus === "partial") {
      const paid = transaction.debtPaidAmount ?? 0;
      return `Parcial: ${formatMoney(paid, currency)} de ${formatMoney(
        transaction.amount,
        currency,
      )}`;
    }
    return "Pagada";
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
      <div className="txn-amount" style={{ color: amountColor }}>
        {sign}
        {formatMoney(transaction.amount, currency)}
      </div>
    </article>
  );
}
