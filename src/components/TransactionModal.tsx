import { useState } from "react";
import { useApp } from "../AppContext";
import { CATEGORIES } from "../data/categories";
import { toISODate } from "../utils/date";
import type { Transaction, TransactionType, DebtStatus } from "../types";

interface TransactionModalProps {
  editingId: string | null;
  onClose: () => void;
}

export default function TransactionModal({
  editingId,
  onClose,
}: TransactionModalProps) {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    showToast,
    showConfirm,
  } = useApp();

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

  const filteredCats = CATEGORIES.filter((c) => c.type === transactionType);

  const handleTypeChange = (next: TransactionType) => {
    setTransactionType(next);
    if (!editingId) {
      setSelectedCategoryId(
        CATEGORIES.filter((c) => c.type === next)[0]?.id || "",
      );
    }
  };

  const handleCopyAmount = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount === 0) return;
    try {
      await navigator.clipboard.writeText(numAmount.toString());
      showToast("Monto copiado");
    } catch {
      showToast(
        "No se pudo copiar el monto",
        "fa-circle-exclamation",
        "var(--danger)",
      );
    }
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showToast(
        "Ingresa un monto válido",
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }
    if (!date) {
      showToast(
        "Selecciona una fecha",
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }

    const paidAmount = parseFloat(debtPaidAmount) || 0;
    if (transactionType === "debt" && debtStatus === "partial" && paidAmount <= 0) {
      showToast(
        "Ingresa el monto pagado parcial",
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
        "Define al menos un día de recurrencia",
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }
    if (transactionType === "debt" && paidAmount > numAmount) {
      showToast(
        "El monto pagado no puede ser mayor al total",
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }

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
      showToast("Transacción actualizada");
    } else {
      addTransaction(data);
      showToast("Transacción guardada");
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editingId) return;
    showConfirm("Eliminar", "Esta acción no se puede deshacer.", () => {
      deleteTransaction(editingId);
      onClose();
      showToast("Transacción eliminada", "fa-trash", "var(--danger)");
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
          {editingId ? "Editar transacción" : "Nueva transacción"}
        </h2>

        {/* Tipo */}
        <div className="type-toggle" style={{ marginBottom: 16 }}>
          <button
            className={`type-btn ${transactionType === "expense" ? "active-expense" : ""}`}
            onClick={() => handleTypeChange("expense")}
          >
            Gasto
          </button>
          <button
            className={`type-btn ${transactionType === "income" ? "active-income" : ""}`}
            onClick={() => handleTypeChange("income")}
          >
            Ingreso
          </button>
          <button
            className={`type-btn ${transactionType === "debt" ? "active-debt" : ""}`}
            onClick={() => handleTypeChange("debt")}
          >
            Deuda
          </button>
        </div>

        {/* Monto */}
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Monto</label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              className="input-field input-amount"
              placeholder="0.00"
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
            <label className="field-label">Registro constante</label>
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
                Aplicar cada mes en día fijo
              </span>
            </div>
          </div>
        )}
        {transactionType !== "debt" && isRecurring && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Días de recurrencia</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: 15, 30"
              value={recurrenceDaysInput}
              onChange={(e) => setRecurrenceDaysInput(e.target.value)}
            />
            <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 6 }}>
              Ingresa uno o varios días del mes.
            </p>
          </div>
        )}
        {transactionType !== "debt" && isRecurring && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Registro retroactivo</label>
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
                Aplicar también en meses anteriores
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 6 }}>
              Si está desactivado, el registro solo se aplica desde el mes
              actual, sin alterar meses anteriores.
            </p>
          </div>
        )}
        {transactionType === "debt" && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Estado de la deuda</label>
            <select
              className="input-field"
              value={debtStatus}
              onChange={(e) => setDebtStatus(e.target.value as DebtStatus)}
            >
              <option value="pending">Pendiente</option>
              <option value="partial">Parcialmente pagada</option>
              <option value="paid">Pagada</option>
            </select>
          </div>
        )}

        {transactionType === "debt" && debtStatus === "partial" && (
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Monto pagado</label>
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
            <label className="field-label">Fecha límite (opcional)</label>
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
          <label className="field-label">Categoría</label>
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
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Descripción</label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Almuerzo en oficina"
            maxLength={60}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Fecha */}
        <div style={{ marginBottom: 24 }}>
          <label className="field-label">Fecha</label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ cursor: "pointer" }}
          />
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {editingId ? "Actualizar transacción" : "Guardar transacción"}
        </button>

        {editingId && (
          <button className="btn-delete-outline" onClick={handleDelete}>
            Eliminar transacción
          </button>
        )}

        <button className="btn-ghost" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
