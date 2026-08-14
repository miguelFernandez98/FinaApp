import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useApp } from "../AppContext";
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
  const { currency } = useApp();
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
  }, [transactions, type]);

  if (!chartData.length) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-chart-pie" />
        <p style={{ fontSize: 13 }}>
          {type === "expense"
            ? "Sin gastos este mes"
            : "Sin ingresos este mes"}
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
          {type === "expense" ? "Gastos" : "Ingresos"}
        </span>
      </div>
    </div>
  );
}
