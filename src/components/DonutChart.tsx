import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { useApp } from "../context";
import { getCatById, formatMoney } from "../utils/helpers";
import type { Transaction } from "../types";

interface Props {
  transactions: Transaction[];
}

export default function DonutChart({ transactions }: Props) {
  const { currency } = useApp();

  const chartData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    if (expenses.length === 0) return null;

    const catMap: Record<string, number> = {};
    expenses.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([id]) => getCatById(id).name);
    const data = sorted.map(([, v]) => v);
    const colors = sorted.map(([id]) => getCatById(id).color);

    return { labels, data, colors };
  }, [transactions]);

  if (!chartData) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-chart-pie" />
        <p style={{ fontSize: 13 }}>Sin gastos este mes</p>
      </div>
    );
  }

  return (
    <Doughnut
      data={{
        labels: chartData.labels,
        datasets: [
          {
            data: chartData.data,
            backgroundColor: chartData.colors,
            borderColor: "transparent",
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "#6b6b80",
              font: { family: "DM Sans", size: 11 },
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 3,
              useBorderRadius: true,
              padding: 8,
            },
          },
          tooltip: {
            backgroundColor: "#1a1a24",
            titleColor: "#f0f0f5",
            bodyColor: "#f0f0f5",
            borderColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            cornerRadius: 10,
            padding: 10,
            titleFont: { family: "Space Grotesk", weight: 600 },
            bodyFont: { family: "DM Sans" },
            callbacks: {
              label: (ctx) => {
                const parsedValue = ctx.parsed as number;
                return " " + formatMoney(parsedValue, currency);
              },
            },
          },
        },
      }}
    />
  );
}
