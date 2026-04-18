import { useApp } from "../context";

export default function ConfirmDialog() {
  const { confirm, closeConfirm } = useApp();

  if (!confirm.visible) return null;

  return (
    <div
      className="confirm-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeConfirm();
      }}
    >
      <div className="confirm-box">
        <i
          className="fa-solid fa-triangle-exclamation"
          style={{ fontSize: 32, color: "var(--danger)", marginBottom: 12 }}
        />
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
          {confirm.title}
        </h3>
        <p style={{ fontSize: 14, color: "var(--fg-muted)", marginBottom: 20 }}>
          {confirm.message}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-cancel" onClick={closeConfirm}>
            Cancelar
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm.onConfirm) confirm.onConfirm();
              closeConfirm();
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
