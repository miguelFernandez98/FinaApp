import { useMemo } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../AppContext";
import { monthName, t, useI18n } from "../i18n";
import { formatMoney } from "../utils/format";
import { getMonthTransactions } from "../utils/transactions";

function BarTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string; name?: string }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="chart-tooltip-row">
          <span
            className="chart-tooltip-dot"
            style={{ background: entry.color }}
          />
          <span>{entry.name ?? entry.dataKey}</span>
          <strong>{formatMoney(entry.value, currency)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function BarChart() {
  const { currentMonth, currentYear, transactions, currency } = useApp();
  const { language } = useI18n();

  const chartData = useMemo(() => {
    const incomeKey = t("bar.income");
    const expenseKey = t("bar.expense");
    const rows: Array<{
      name: string;
      income: number;
      expense: number;
      incomeKey: string;
      expenseKey: string;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      while (m < 0) {
        m += 12;
        y--;
      }
      const monthTxns = getMonthTransactions(transactions, m, y);

      rows.push({
        name: monthName(m).substring(0, 3),
        income: monthTxns
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
        expense: monthTxns
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
        incomeKey,
        expenseKey,
      });
    }

    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear, transactions, language]);

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={chartData}
          margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid
            vertical={false}
            stroke="rgba(255,255,255,0.04)"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#6b6b80", fontSize: 11, fontFamily: "DM Sans" }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#6b6b80", fontSize: 11, fontFamily: "DM Sans" }}
            tickFormatter={(value: number) =>
              currency + (value >= 1000 ? (value / 1000).toFixed(0) + "k" : String(value))
            }
            width={44}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={<BarTooltip currency={currency} />}
            wrapperStyle={{
              outline: "none",
              background: "transparent",
              border: "none",
              padding: 0,
            }}
          />
          <Bar
            dataKey="income"
            name={t("bar.income")}
            fill="rgba(74, 222, 128, 0.7)"
            radius={[6, 6, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="expense"
            name={t("bar.expense")}
            fill="rgba(255, 92, 92, 0.7)"
            radius={[6, 6, 0, 0]}
            maxBarSize={18}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}