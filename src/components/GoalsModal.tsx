import { useState } from "react";
import { useApp } from "../AppContext";
import { t, useI18n } from "../i18n";
import { formatMoney } from "../utils/format";
import { generateId } from "../utils/transactions";
import { toISODate } from "../utils/date";
import ModalSheet from "./ModalSheet";

interface GoalsModalProps {
  onClose: () => void;
}

export default function GoalsModal({ onClose }: GoalsModalProps) {
  const { goals, setGoals, currency, showConfirm, showToast } = useApp();
  useI18n();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast(t("goals.name_required"), "fa-circle-exclamation", "var(--danger)");
      return;
    }
    const parsed = parseFloat(target);
    if (Number.isNaN(parsed) || parsed <= 0) {
      showToast(
        t("goals.target_required"),
        "fa-circle-exclamation",
        "var(--danger)",
      );
      return;
    }
    setGoals([
      ...goals,
      {
        id: generateId(),
        name: trimmed,
        target: parsed,
        saved: 0,
        deadline: deadline || undefined,
      },
    ]);
    setName("");
    setTarget("");
    setDeadline("");
    showToast(t("goals.saved_toast"));
  };

  const handleUpdateSaved = (id: string, value: string) => {
    const parsed = parseFloat(value);
    const saved = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setGoals(goals.map((g) => (g.id === id ? { ...g, saved } : g)));
  };

  const handleDelete = (id: string) => {
    showConfirm(t("goals.delete"), t("goals.delete.body"), () => {
      setGoals(goals.filter((g) => g.id !== id));
      showToast(t("goals.deleted_toast"), "fa-trash", "var(--danger)");
    });
  };

  return (
    <ModalSheet onClose={onClose}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          {t("goals.title")}
        </h2>

        {goals.length === 0 ? (
          <div className="empty-state" style={{ padding: "24px 16px" }}>
            <i className="fa-solid fa-piggy-bank" />
            <div className="empty-state-title">{t("home.goals_empty")}</div>
            <p>{t("home.goals_empty.body")}</p>
          </div>
        ) : (
          goals.map((goal) => {
            const pct = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
            const done = goal.saved >= goal.target && goal.target > 0;
            return (
              <div key={goal.id} className="goal-row">
                <div className="goal-header">
                  <div>
                    <span className="goal-name">{goal.name}</span>
                    {goal.deadline && (
                      <span className="goal-deadline">
                        {t("home.goals_deadline", { date: goal.deadline })}
                      </span>
                    )}
                  </div>
                  <button
                    className="icon-btn icon-btn-danger"
                    onClick={() => handleDelete(goal.id)}
                    aria-label={t("goals.delete")}
                    title={t("goals.delete")}
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
                <div className="budget-bar-track" style={{ marginTop: 8 }}>
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: done ? "var(--success)" : "var(--accent)",
                    }}
                  />
                </div>
                <div className="goal-progress-row">
                  <div className="goal-saved-edit">
                    <span className="field-label" style={{ marginBottom: 0 }}>
                      {t("goals.saved")}
                    </span>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: 110, padding: "8px 10px", fontSize: 13 }}
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={goal.saved > 0 ? String(goal.saved) : ""}
                      onChange={(e) => handleUpdateSaved(goal.id, e.target.value)}
                    />
                  </div>
                  <div className="goal-amounts">
                    <span className="goal-pct">{Math.round(pct)}%</span>
                    <span className="goal-amount">
                      {done && <i className="fa-solid fa-circle-check" />}
                      {formatMoney(goal.saved, currency)} /{" "}
                      {formatMoney(goal.target, currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="goal-add-section">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            {t("goals.add")}
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              type="text"
              className="input-field"
              placeholder={t("goals.name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label={t("goals.name")}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="number"
                className="input-field"
                placeholder={t("goals.target_placeholder")}
                min="0"
                step="0.01"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                aria-label={t("goals.target")}
              />
              <input
                type="date"
                className="input-field"
                style={{ width: "45%" }}
                min={toISODate(new Date())}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                aria-label={t("goals.deadline")}
              />
            </div>
          </div>
          <button
            className="btn-primary"
            style={{ marginTop: 12 }}
            onClick={handleAdd}
          >
            {t("goals.add_btn")}
          </button>
        </div>

        <button className="btn-ghost" onClick={onClose}>
          {t("goals.cancel")}
        </button>
    </ModalSheet>
  );
}