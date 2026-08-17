import { useState } from "react";
import { useApp } from "../AppContext";
import { CATEGORIES } from "../data/categories";
import { categoryName, t, useI18n } from "../i18n";
import { toISODate } from "../utils/date";
import type { Transaction, TransactionType, DebtStatus } from "../types";
import CustomSelect from "./CustomSelect";

export default function TransactionModal() {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    showToast,
    showConfirm,
    txnModalEditingId: editingId,
    closeTransactionModal: onClose,
  } = useApp();
  const { language } = useI18n();

  const editingTransaction = editingId
    ? (transactions.find(
        (tx) => tx.id === editingId || tx.recurringId === editingId,
      ) ?? null)
    : null;

  const [transactionType, setTransactionType] = useState<TransactionType>(
    editingTransaction?.type ?? "expense",
  );
  const [amount, setAmount] = useState(
    editingTransaction ? String(editingTransaction.amount) : "",
  );
  const [description, setDescription] = useState(
    editingTransaction?.description ?? "",
  );
  const [date, setDate] = useState(
    editingTransaction?.date ?? toISODate(new Date()),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    editingTransaction?.category ?? "",
  );
  const [debtStatus, setDebtStatus] = useState<DebtStatus>(
    editingTransaction?.debtStatus ?? "pending",
  );
  const [debtPaidAmount, setDebtPaidAmount] = useState(
    editingTransaction?.debtPaidAmount?.toString() ?? "",
  );
  const [debtDueDate, setDebtDueDate] = useState(
    editingTransaction?.debtDueDate ?? "",
  );
  const [isRecurring, setIsRecurring] = useState(
    !!editingTransaction?.isRecurring,
  );
  const [recurrenceDaysInput, setRecurrenceDaysInput] = useState(
    editingTransaction?.recurrenceDays?.join(",") ?? "",
  );
  const [recurringBackfill, setRecurringBackfill] = useState(
    !!editingTransaction?.recurringBackfill,
  );

  const filteredCats = CATEGORIES.filter(
    (c) => c.type === transactionType && !c.hidden,
  );

  const isEditing = !!editingTransaction;

  const handleTypeChange = (next: TransactionType) => {
    if (isEditing) return;
    setTransactionType(next);
    const validForNext = CATEGORIES.filter(
      (c) => c.type === next && !c.hidden,
    );
    const currentStillValid = validForNext.some((c) => c.id === selectedCategoryId);
    if (!currentStillValid) {
      setSelectedCategoryId(validForNext[0]?.id || "");
    }
  };

  const handleCopyAmount = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount === 0) return;
    try {
      await navigator.clipboard.writeText(numAmount.toString());
      showToast(t("modal.amount_copied"));
    } catch {
      showToast(
        t("modal.amount_copy_error"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
    }
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showToast(
        t("modal.amount_invalid"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }
    if (!date) {
      showToast(
        t("modal.date_required"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }

    const paidAmount = parseFloat(debtPaidAmount) || 0;
    if (transactionType === "debt" && debtStatus === "partial" && paidAmount <= 0) {
      showToast(
        t("modal.paid_amount_required"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }
    const recurrenceDays = recurrenceDaysInput
      .split(",")
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => !Number.isNaN(value) && value >= 1 && value <= 31);
    if (isRecurring && recurrenceDays.length === 0) {
      showToast(
        t("modal.recurrence_days_required"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }
    if (transactionType === "debt" && paidAmount > numAmount) {
      showToast(
        t("modal.paid_amount_exceeds"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }

    const becomingPaid =
      transactionType === "debt" && debtStatus === "paid";
    const wasPaid = editingTransaction?.debtStatus === "paid";
    const shouldAsk = becomingPaid && !wasPaid;

    if (shouldAsk) {
      showConfirm(
        t("modal.debt_count_as_expense"),
        t("modal.debt_count_as_expense.body"),
        () => performSave(true),
        {
          confirmLabel: t("modal.debt_yes_expense"),
          cancelLabel: t("modal.debt_no_expense"),
          onCancel: () => performSave(false),
        },
      );
      return;
    }

    performSave(editingTransaction?.countAsExpense ?? false);
  };

  const performSave = (countAsExpense: boolean) => {
    const numAmount = parseFloat(amount);
    const paidAmount = parseFloat(debtPaidAmount) || 0;
    const recurrenceDays = recurrenceDaysInput
      .split(",")
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => !Number.isNaN(value) && value >= 1 && value <= 31);

    const cat = selectedCategoryId || filteredCats[0]?.id || "other_expense";

    const data: Omit<Transaction, "id" | "createdAt"> = {
      type: transactionType,
      amount: numAmount,
      category: cat,
      description: description.trim(),
      date,
      ...(transactionType === "debt"
        ? {
            debtStatus,
            debtPaidAmount: paidAmount || undefined,
            debtDueDate: debtDueDate || undefined,
            debtPaidDate:
              debtStatus === "paid"
                ? (editingTransaction?.debtPaidDate ??
                  toISODate(new Date()))
                : undefined,
            countAsExpense:
              debtStatus === "paid" ? countAsExpense : undefined,
          }
        : {}),
      ...(transactionType !== "debt" && isRecurring
        ? {
            isRecurring: true,
            recurrenceDays,
            recurringBackfill,
          }
        : {
            isRecurring: false,
            recurrenceDays: undefined,
            recurringBackfill: undefined,
          }),
    };

    if (editingId) {
      updateTransaction(editingId, data);
      showToast(t("modal.updated"));
    } else {
      addTransaction(data);
      showToast(t("modal.saved"));
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editingId) return;
    showConfirm(t("modal.delete_confirm"), t("modal.delete_confirm.body"), () => {
      deleteTransaction(editingId);
      onClose();
      showToast(t("modal.deleted"), "fa-trash", "var(--danger)");
    });
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-sheet">
        <div className="modal-handle" />

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          {editingId ? t("modal.edit") : t("modal.new")}
        </h2>

        {/* Tipo */}
        <div className="type-toggle" style={{ marginBottom: 16 }}>
          <button
            className={`type-btn ${transactionType === "expense" ? "active-expense" : ""}`}
            onClick={() => handleTypeChange("expense")}
            disabled={isEditing}
          >
            {t("modal.expense")}
          </button>
          <button
            className={`type-btn ${transactionType === "income" ? "active-income" : ""}`}
            onClick={() => handleTypeChange("income")}
            disabled={isEditing}
          >
            {t("modal.income")}
          </button>
          <button
            className={`type-btn ${transactionType === "debt" ? "active-debt" : ""}`}
            onClick={() => handleTypeChange("debt")}
            disabled={isEditing}
          >
            {t("modal.debt")}
          </button>
        </div>
        {isEditing && (
          <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: -8, marginBottom: 16 }}>
            {t("modal.type_locked")}
          </p>
        )}

        {/* Monto */}
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">{t("modal.amount")}</label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              className="input-field input-amount"
              placeholder={t("modal.amount_placeholder")}
              step="0.01"
              min="0"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              type="button"
              onClick={handleCopyAmount}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "var(--card)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                width: 36,
                height: 36,
                display: "grid",
                placeItems: "center",
                cursor:
                  amount && parseFloat(amount) !== 0
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              <i className="fa-solid fa-copy" />
            </button>
          </div>
        </div>

        {transactionType !== "debt" && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">{t("modal.recurring")}</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <span className="slider" />
              </label>
              <span style={{ fontSize: 14, color: "var(--fg-muted)" }}>
                {t("modal.recurring_hint")}
              </span>
            </div>
          </div>
        )}
        {transactionType !== "debt" && isRecurring && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">{t("modal.recurring_days")}</label>
            <input
              type="text"
              className="input-field"
              placeholder={t("modal.recurring_days_placeholder")}
              value={recurrenceDaysInput}
              onChange={(e) => setRecurrenceDaysInput(e.target.value)}
            />
            <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 6 }}>
              {t("modal.recurring_days_hint")}
            </p>
          </div>
        )}
        {transactionType !== "debt" && isRecurring && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">{t("modal.backfill")}</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={recurringBackfill}
                  onChange={(e) => setRecurringBackfill(e.target.checked)}
                />
                <span className="slider" />
              </label>
              <span style={{ fontSize: 14, color: "var(--fg-muted)" }}>
                {t("modal.backfill_hint")}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 6 }}>
              {t("modal.backfill_body")}
            </p>
          </div>
        )}
        {transactionType === "debt" && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">{t("modal.debt_status")}</label>
            <CustomSelect
              value={debtStatus}
              onChange={(value) => setDebtStatus(value as DebtStatus)}
              options={[
                { value: "pending", label: t("modal.status_pending") },
                { value: "partial", label: t("modal.status_partial") },
                { value: "paid", label: t("modal.status_paid") },
              ]}
            />
          </div>
        )}

        {transactionType === "debt" && debtStatus === "partial" && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">{t("modal.debt_paid_amount")}</label>
            <input
              type="number"
              className="input-field"
              placeholder="0.00"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={debtPaidAmount}
              onChange={(e) => setDebtPaidAmount(e.target.value)}
            />
          </div>
        )}

        {transactionType === "debt" && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">{t("modal.debt_due_date")}</label>
            <input
              type="date"
              className="input-field"
              value={debtDueDate}
              onChange={(e) => setDebtDueDate(e.target.value)}
              style={{ cursor: "pointer" }}
            />
          </div>
        )}

        {/* Categoría */}
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">{t("modal.category")}</label>
          <div className="cat-grid">
            {filteredCats.map((cat) => (
              <div
                key={cat.id}
                className={`cat-option ${selectedCategoryId === cat.id ? "selected" : ""}`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                <i
                  className={`fa-solid ${cat.icon}`}
                  style={{ color: cat.color }}
                />
                <span>{categoryName(cat.id, language)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">{t("modal.description")}</label>
          <input
            type="text"
            className="input-field"
            placeholder={t("modal.description_placeholder")}
            maxLength={60}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Fecha */}
        <div style={{ marginBottom: 24 }}>
          <label className="field-label">{t("modal.date")}</label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ cursor: "pointer" }}
          />
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {editingId ? t("modal.update") : t("modal.save")}
        </button>

        {editingId && (
          <button className="btn-delete-outline" onClick={handleDelete}>
            {t("modal.delete")}
          </button>
        )}

        <button className="btn-ghost" onClick={onClose}>
          {t("modal.cancel")}
        </button>
      </div>
    </div>
  );
}
