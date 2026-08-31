import { useAppUI, useAppActions } from "../AppContext";
import { monthName, t, useI18n } from "../i18n";

export default function MonthSelector() {
  const { currentMonth, currentYear } = useAppUI();
  const { changeMonth } = useAppActions();
  useI18n();

  return (
    <div className="month-selector">
      <button className="month-arrow" onClick={() => changeMonth(-1)} aria-label={t("month.prev")}>
        <i className="fa-solid fa-chevron-left" />
      </button>
      <span className="month-label">
        {monthName(currentMonth)} {currentYear}
      </span>
      <button className="month-arrow" onClick={() => changeMonth(1)} aria-label={t("month.next")}>
        <i className="fa-solid fa-chevron-right" />
      </button>
    </div>
  );
}
