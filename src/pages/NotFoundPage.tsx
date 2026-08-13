import { useApp } from "../AppContext";
import AppVersion from "../components/AppVersion";

export default function NotFoundPage() {
  const { navigateTo } = useApp();

  return (
    <section className="page notfound-page" aria-labelledby="notfound-title">
      <header className="page-header">
        <h1 id="notfound-title" className="page-title">
          Página no encontrada <AppVersion />
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
          La ruta que buscas no existe o fue movida. Vuelve al inicio para
          seguir administrando tus finanzas.
        </p>
        <button className="btn-primary" onClick={() => navigateTo("home")}>
          <i className="fa-solid fa-house" /> Ir al inicio
        </button>
      </div>
    </section>
  );
}
