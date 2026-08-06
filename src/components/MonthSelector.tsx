import { useApp } from "../AppContext";
import { MONTH_NAMES } from "../utils/date";

export default function MonthSelector() {
  const { currentMonth, currentYear, changeMonth } = useApp();

  return (
    <div className="month-selector">
      <button className="month-arrow" onClick={() => changeMonth(-1)}>
        <i className="fa-solid fa-chevron-left" />
      </button>
      <span className="month-label">
        {MONTH_NAMES[currentMonth]} {currentYear}
      </span>
      <button className="month-arrow" onClick={() => changeMonth(1)}>
        <i className="fa-solid fa-chevron-right" />
      </button>
    </div>
  );
}
