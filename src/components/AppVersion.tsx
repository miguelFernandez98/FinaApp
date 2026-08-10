import { version } from "../../package.json";

export default function AppVersion() {
  return (
    <span
      className="app-version"
      aria-label={`Versión de la aplicación ${version}`}
    >
      v{version}
    </span>
  );
}
