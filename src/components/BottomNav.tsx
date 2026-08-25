import { useAppUI, useAppActions } from "../AppContext";
import { t, useI18n } from "../i18n";
import type { PageId } from "../types";

const NAV_ITEMS: { page: PageId; icon: string; labelKey: string }[] = [
  { page: "home", icon: "fa-house", labelKey: "nav.home" },
  {
    page: "transactions",
    icon: "fa-arrow-right-arrow-left",
    labelKey: "nav.transactions",
  },
  { page: "stats", icon: "fa-chart-simple", labelKey: "nav.stats" },
  { page: "settings", icon: "fa-gear", labelKey: "nav.settings" },
];

export default function BottomNav() {
  const { currentPage } = useAppUI();
  const { navigateTo, openTransactionModal } = useAppActions();
  useI18n();

  return (
    <footer className="bottom-nav">
      <nav
        style={{ display: "flex", width: "100%", alignItems: "center" }}
        aria-label={t("nav.main")}
      >
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <button
            key={item.page}
            className={`nav-item ${currentPage === item.page ? "active" : ""}`}
            onClick={() => navigateTo(item.page)}
            aria-current={currentPage === item.page ? "page" : undefined}
          >
            <i className={`fa-solid ${item.icon}`} />
            <span>{t(item.labelKey)}</span>
          </button>
        ))}

        <button
          className="nav-add-btn"
          onClick={() => openTransactionModal()}
          aria-label={t("nav.add")}
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
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>
    </footer>
  );
}
