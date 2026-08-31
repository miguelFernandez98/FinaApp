import { useAppActions } from "../AppContext";
import AppVersion from "../components/AppVersion";
import { t, useI18n } from "../i18n";

export default function NotFoundPage() {
  const { navigateTo } = useAppActions();
  useI18n();

  return (
    <section className="page notfound-page" aria-labelledby="notfound-title">
      <header className="page-header">
        <h1 id="notfound-title" className="page-title">
          {t("nav.notfound")} <AppVersion />
        </h1>
      </header>

      <div
        className="glass-card"
        style={{ textAlign: "center", padding: "48px 24px" }}
      >
        <div
          style={{
            fontSize: 56,
            color: "var(--accent)",
            marginBottom: 12,
          }}
        >
          <i className="fa-solid fa-map-signs" aria-hidden="true" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>404</h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--fg-muted)",
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          {t("nav.notfound.body")}
        </p>
        <button className="btn-primary" onClick={() => navigateTo("home")}>
          <i className="fa-solid fa-house" /> {t("nav.home_go")}
        </button>
      </div>
    </section>
  );
}
