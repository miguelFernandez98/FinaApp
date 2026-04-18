import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useApp } from "../context";
import { MONTH_NAMES } from "../data/categories";
import { formatMoney } from "../utils/helpers";

export default function BarChart() {
  const { currentMonth, currentYear, transactions, currency } = useApp();

  const chartData = useMemo(() => {
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      while (m < 0) {
        m += 12;
        y--;
      }
      labels.push(MONTH_NAMES[m].substring(0, 3));

      const monthTxns = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });

      incomeData.push(
        monthTxns
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
      );
      expenseData.push(
        monthTxns
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
      );
    }

    return { labels, incomeData, expenseData };
  }, [currentMonth, currentYear, transactions]);

  return (
    <Bar
      data={{
        labels: chartData.labels,
        datasets: [
          {
            label: "Ingresos",
            data: chartData.incomeData,
            backgroundColor: "rgba(74, 222, 128, 0.7)",
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
          },
          {
            label: "Gastos",
            data: chartData.expenseData,
            backgroundColor: "rgba(255, 92, 92, 0.7)",
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#6b6b80", font: { family: "DM Sans", size: 11 } },
            border: { display: false },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color: "#6b6b80",
              font: { family: "DM Sans", size: 11 },
              callback: (value) => {
                const numericValue =
                  typeof value === "number" ? value : Number(value);
                return (
                  currency +
                  (numericValue >= 1000
                    ? (numericValue / 1000).toFixed(0) + "k"
                    : String(numericValue))
                );
              },
            },
            border: { display: false },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#6b6b80",
              font: { family: "DM Sans", size: 11 },
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 3,
              useBorderRadius: true,
              padding: 12,
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
            callbacks: {
              label: (ctx) =>
                " " +
                ctx.dataset.label +
                ": " +
                formatMoney(ctx.parsed.y as number, currency),
            },
          },
        },
      }}
    />
  );
}
