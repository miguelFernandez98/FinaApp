import { useApp } from "../AppContext";
import type { PageId } from "../types";

const NAV_ITEMS: { page: PageId; icon: string; label: string }[] = [
  { page: "home", icon: "fa-house", label: "Inicio" },
  {
    page: "transactions",
    icon: "fa-arrow-right-arrow-left",
    label: "Movimientos",
  },
  { page: "stats", icon: "fa-chart-simple", label: "Estadísticas" },
  { page: "settings", icon: "fa-gear", label: "Ajustes" },
];

export default function BottomNav() {
  const { currentPage, navigateTo, openTransactionModal } = useApp();

  return (
    <footer className="bottom-nav">
      <nav
        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-around" }}
        aria-label="Navegación principal"
      >
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <button
            key={item.page}
            className={`nav-item ${currentPage === item.page ? "active" : ""}`}
            onClick={() => navigateTo(item.page)}
            aria-current={currentPage === item.page ? "page" : undefined}
          >
            <i className={`fa-solid ${item.icon}`} />
            <span>{item.label}</span>
          </button>
        ))}

        <button
          className="nav-add-btn"
          onClick={() => openTransactionModal()}
          aria-label="Agregar transacción"
          id="global-add-btn"
        >
          <i className="fa-solid fa-plus" />
        </button>

        {NAV_ITEMS.slice(2).map((item) => (
          <button
            key={item.page}
            className={`nav-item ${currentPage === item.page ? "active" : ""}`}
            onClick={() => navigateTo(item.page)}
            aria-current={currentPage === item.page ? "page" : undefined}
          >
            <i className={`fa-solid ${item.icon}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </footer>
  );
}
