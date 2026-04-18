import { useState, useEffect } from "react";
import { useApp } from "../context";
import { CATEGORIES } from "../data/categories";
import { getCatById } from "../utils/helpers";
import type { Transaction } from "../types";

interface Props {
  editingId: string | null;
  onClose: () => void;
}

export default function TransactionModal({ editingId, onClose }: Props) {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    showToast,
    showConfirm,
    exchangeRates,
  } = useApp();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCat, setSelectedCat] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcAmount, setCalcAmount] = useState("");
  const [calcFrom, setCalcFrom] = useState<"VES" | "USD_BCV" | "USD_BINANCE">(
    "USD_BCV",
  );

  const filteredCats = CATEGORIES.filter((c) => c.type === type);

  // Cargar datos al editar
  useEffect(() => {
    if (editingId) {
      const t = transactions.find((tx) => tx.id === editingId);
      if (t) {
        setType(t.type);
        setAmount(String(t.amount));
        setDescription(t.description);
        setDate(t.date);
        setSelectedCat(t.category);
      }
    } else {
      setType("expense");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setSelectedCat(filteredCats[0]?.id || "");
    }
  }, [editingId, transactions]);

  // Resetear categoría al cambiar tipo
  useEffect(() => {
    if (!editingId) {
      setSelectedCat(filteredCats[0]?.id || "");
    }
  }, [type]);

  const convertAmount = () => {
    const numCalcAmount = parseFloat(calcAmount);
    if (isNaN(numCalcAmount) || !exchangeRates.bcv || !exchangeRates.binance)
      return;

    const rate =
      calcFrom === "USD_BCV" ? exchangeRates.bcv : exchangeRates.binance;
    const converted = numCalcAmount * rate;
    setAmount(String(converted));
    setShowCalculator(false);
    showToast("Monto convertido a bolívares");
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
    const cat = selectedCat || filteredCats[0]?.id || "other_expense";

    const data: Omit<Transaction, "id" | "createdAt"> = {
      type,
      amount: numAmount,
      category: cat,
      description: description.trim(),
      date,
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
            className={`type-btn ${type === "expense" ? "active-expense" : ""}`}
            onClick={() => setType("expense")}
          >
            Gasto
          </button>
          <button
            className={`type-btn ${type === "income" ? "active-income" : ""}`}
            onClick={() => setType("income")}
          >
            Ingreso
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
              onClick={() => setShowCalculator(!showCalculator)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <i className="fa-solid fa-calculator" />
            </button>
          </div>
        </div>

        {/* Calculadora integrada */}
        {showCalculator && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "var(--card)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="number"
                className="input-field"
                placeholder="Monto en USD"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                className="input-field"
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value as any)}
                style={{ width: 120 }}
              >
                <option value="USD_BCV">BCV</option>
                <option value="USD_BINANCE">Binance</option>
              </select>
            </div>
            <button
              type="button"
              onClick={convertAmount}
              className="btn-primary"
              style={{ width: "100%", fontSize: 14 }}
            >
              Convertir a Bolívares
            </button>
          </div>
        )}

        {/* Categoría */}
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Categoría</label>
          <div className="cat-grid">
            {filteredCats.map((cat) => (
              <div
                key={cat.id}
                className={`cat-option ${selectedCat === cat.id ? "selected" : ""}`}
                onClick={() => setSelectedCat(cat.id)}
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
