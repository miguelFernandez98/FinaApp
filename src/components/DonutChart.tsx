import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAppData } from "../AppContext";
import { t, useI18n } from "../i18n";
import { formatMoney } from "../utils/format";
import { getCategoryById } from "../utils/transactions";
import type { Transaction } from "../types";

interface DonutChartProps {
  transactions: Transaction[];
  type: "expense" | "income";
}

interface PieDatum {
  id: string;
  name: string;
  value: number;
  color: string;
}

function DonutTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: PieDatum }>;
  currency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{entry.name}</div>
      <div className="chart-tooltip-row">
        <span
          className="chart-tooltip-dot"
          style={{ background: entry.payload.color }}
        />
        <strong>{formatMoney(entry.value, currency)}</strong>
      </div>
    </div>
  );
}

export default function DonutChart({ transactions, type }: DonutChartProps) {
  const { currency } = useAppData();
  const { language } = useI18n();
  const [hovered, setHovered] = useState<number | null>(null);

  const { chartData, total } = useMemo(() => {
    const ofType = transactions.filter((t) => t.type === type);

    const catMap: Record<string, number> = {};
    ofType.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const data = sorted.map(([id, value]) => ({
      id,
      name: getCategoryById(id).name,
      value,
      color: getCategoryById(id).color,
    }));
    const sum = data.reduce((acc, d) => acc + d.value, 0);
    return { chartData: data, total: sum };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, type, language]);

  if (!chartData.length) {
    return (
      <div className="empty-state" style={{ padding: "24px 16px" }}>
        <i className="fa-solid fa-chart-pie" />
        <div className="empty-state-title">
          {type === "expense"
            ? t("donut.empty_expense")
            : t("donut.empty_income")}
        </div>
        <p>
          {type === "expense"
            ? t("donut.empty_expense.body")
            : t("donut.empty_income.body")}
        </p>
      </div>
    );
  }

  return (
    <div className="chart-wrap donut-chart">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="64%"
            outerRadius="90%"
            cornerRadius={8}
            paddingAngle={2}
            strokeWidth={0}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
            onMouseEnter={(_, index) => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.id}
                fill={entry.color}
                opacity={hovered === null || hovered === index ? 1 : 0.35}
                style={{ transition: "opacity 0.2s ease", outline: "none" }}
              />
            ))}
          </Pie>
          <Tooltip
            trigger="click"
            content={<DonutTooltip currency={currency} />}
            wrapperStyle={{
              outline: "none",
              background: "transparent",
              border: "none",
              padding: 0,
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
      <div className="chart-center">
        <span className="chart-center-value">{formatMoney(total, currency)}</span>
        <span className="chart-center-label">
          {type === "expense" ? t("donut.expense") : t("donut.income")}
        </span>
      </div>
    </div>
  );
}
