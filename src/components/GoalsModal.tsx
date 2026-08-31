import { useState } from "react";
import { useAppData, useAppActions } from "../AppContext";
import { t, useI18n } from "../i18n";
import { formatMoney } from "../utils/format";
import { generateId } from "../utils/transactions";
import { toISODate } from "../utils/date";
import ModalSheet from "./ModalSheet";

interface GoalsModalProps {
  onClose: () => void;
}

const QUICK_AMOUNTS = [10, 50, 100, 500];

export default function GoalsModal({ onClose }: GoalsModalProps) {
  const { goals, currency } = useAppData();
  const { setGoals, showConfirm, showToast } = useAppActions();
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

  const handleQuickAdd = (id: string, amount: number) => {
    setGoals(
      goals.map((g) =>
        g.id === id ? { ...g, saved: Math.max(0, g.saved + amount) } : g,
      ),
    );
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
          const remaining = Math.max(0, goal.target - goal.saved);
          return (
            <div key={goal.id} className="goal-row">
              <div className="goal-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="goal-name">{goal.name}</span>
                  {goal.deadline && (
                    <span className="goal-deadline">
                      <i className="fa-regular fa-calendar" style={{ marginRight: 4 }} />
                      {goal.deadline}
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

              <div className="budget-bar-track" style={{ marginTop: 10, height: 8 }}>
                <div
                  className="budget-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: done
                      ? "linear-gradient(90deg, var(--success), #22c55e)"
                      : "linear-gradient(90deg, var(--accent), #a3e635)",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: done ? "var(--success)" : "var(--accent)" }}>
                  {Math.round(pct)}%
                </span>
                <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                  {done ? (
                    <span style={{ color: "var(--success)" }}>
                      <i className="fa-solid fa-circle-check" /> {t("goals.completed")}
                    </span>
                  ) : (
                    `${formatMoney(remaining, currency)} ${t("goals.remaining")}`
                  )}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => handleQuickAdd(goal.id, -10)}
                  aria-label="-10"
                  style={{ width: 32, height: 32, fontSize: 14 }}
                >
                  <i className="fa-solid fa-minus" />
                </button>
                <input
                  type="number"
                  className="input-field"
                  style={{ flex: 1, padding: "8px 10px", fontSize: 14, textAlign: "center" }}
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={goal.saved > 0 ? String(goal.saved) : ""}
                  onChange={(e) => handleUpdateSaved(goal.id, e.target.value)}
                  aria-label={t("goals.saved")}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => handleQuickAdd(goal.id, 10)}
                  aria-label="+10"
                  style={{ width: 32, height: 32, fontSize: 14 }}
                >
                  <i className="fa-solid fa-plus" />
                </button>
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "center" }}>
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="btn-ghost"
                    style={{ padding: "4px 10px", fontSize: 11, borderRadius: 8, minWidth: 0 }}
                    onClick={() => handleQuickAdd(goal.id, amt)}
                  >
                    +{formatMoney(amt, currency)}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--fg-muted)" }}>
                <span>{formatMoney(goal.saved, currency)} {t("goals.saved")}</span>
                <span>{formatMoney(goal.target, currency)} {t("goals.target")}</span>
              </div>
            </div>
          );
        })
      )}

      <div className="goal-add-section">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          <i className="fa-solid fa-plus" style={{ marginRight: 8, fontSize: 13 }} />
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
              style={{ flex: 1 }}
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
          <i className="fa-solid fa-plus" style={{ marginRight: 8 }} />
          {t("goals.add_btn")}
        </button>
      </div>

      <button className="btn-ghost" onClick={onClose}>
        {t("goals.cancel")}
      </button>
    </ModalSheet>
  );
}
