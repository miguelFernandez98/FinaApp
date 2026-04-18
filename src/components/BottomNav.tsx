import { useApp } from "../context";
import type { PageId } from "../types";

const NAV_ITEMS: { page: PageId; icon: string; label: string }[] = [
  { page: "home", icon: "fa-house", label: "Inicio" },
  {
    page: "transactions",
    icon: "fa-arrow-right-arrow-left",
    label: "Movimientos",
  },
  { page: "stats", icon: "fa-chart-simple", label: "Estadísticas" },
  { page: "profile", icon: "fa-gear", label: "Ajustes" },
];

export default function BottomNav() {
  const { currentPage, navigateTo } = useApp();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.slice(0, 2).map((item) => (
        <div
          key={item.page}
          className={`nav-item ${currentPage === item.page ? "active" : ""}`}
          onClick={() => navigateTo(item.page)}
        >
          <i className={`fa-solid ${item.icon}`} />
          <span>{item.label}</span>
        </div>
      ))}

      <button
        className="nav-add-btn"
        onClick={() => navigateTo("home")}
        aria-label="Agregar transacción"
        id="global-add-btn"
      >
        <i className="fa-solid fa-plus" />
      </button>

      {NAV_ITEMS.slice(2).map((item) => (
        <div
          key={item.page}
          className={`nav-item ${currentPage === item.page ? "active" : ""}`}
          onClick={() => navigateTo(item.page)}
        >
          <i className={`fa-solid ${item.icon}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}
