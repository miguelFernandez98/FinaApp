import { useApp } from "../AppContext";

export default function Toast() {
  const { toast, closeToast } = useApp();
  return (
    <button
      className={`toast ${toast.visible ? "show" : ""}`}
      onClick={closeToast}
      aria-live="polite"
    >
      <i
        className={`fa-solid ${toast.icon}`}
        style={{ color: toast.color, fontSize: 18 }}
      />
      <span>{toast.message}</span>
    </button>
  );
}