import { version } from "../../package.json";
import { t, useI18n } from "../i18n";

export default function AppVersion() {
  useI18n();
  return (
    <span
      className="app-version"
      aria-label={t("nav.version", { version })}
    >
      v{version}
    </span>
  );
}
