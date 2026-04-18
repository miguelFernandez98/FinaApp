import { useState, useEffect } from "react";
import { useApp } from "../context";
import { CATEGORIES } from "../data/categories";

interface Props {
  onClose: () => void;
}

export default function BudgetModal({ onClose }: Props) {
  const { budgets, setBudgets, showToast } = useApp();
  const [values, setValues] = useState<Record<string, string>>({});

  const expenseCats = CATEGORIES.filter((c) => c.type === "expense");

  useEffect(() => {
    const initial: Record<string, string> = {};
    expenseCats.forEach((c) => {
      initial[c.id] = budgets[c.id] ? String(budgets[c.id]) : "";
    });
    setValues(initial);
  }, [budgets]);

  const handleSave = () => {
    const newBudgets: Record<string, number> = {};
    Object.entries(values).forEach(([id, val]) => {
      const num = parseFloat(val);
      if (num && num > 0) newBudgets[id] = num;
    });
    setBudgets(newBudgets);
    showToast("Presupuestos guardados");
    onClose();
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
          Presupuestos mensuales
        </h2>

        {expenseCats.map((cat) => (
          <div
            key={cat.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              className="cat-icon-sm"
              style={{ background: `${cat.color}20`, color: cat.color }}
            >
              <i className={`fa-solid ${cat.icon}`} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="field-label">{cat.name}</label>
              <input
                type="number"
                className="input-field"
                style={{ padding: "10px 12px", fontSize: 14, marginTop: 4 }}
                placeholder="Sin presupuesto"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={values[cat.id] || ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [cat.id]: e.target.value }))
                }
              />
            </div>
          </div>
        ))}

        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          onClick={handleSave}
        >
          Guardar presupuestos
        </button>
        <button className="btn-ghost" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
