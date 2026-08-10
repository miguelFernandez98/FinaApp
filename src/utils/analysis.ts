import type { Transaction } from "../types";
import { getCategoryById, getMonthTransactions } from "./transactions";
import { MONTH_NAMES } from "./date";

export type AdvisorQuestionId =
  | "overview"
  | "compare"
  | "topSpending"
  | "improve"
  | "budgets";

export interface AdvisorQuestion {
  id: AdvisorQuestionId;
  label: string;
  icon: string;
}

export const ADVISOR_QUESTIONS: AdvisorQuestion[] = [
  {
    id: "overview",
    label: "¿Cómo me fue este mes?",
    icon: "fa-chart-pie",
  },
  {
    id: "compare",
    label: "¿Cómo me fue vs el mes anterior?",
    icon: "fa-scale-balanced",
  },
  {
    id: "topSpending",
    label: "¿En qué gasté más?",
    icon: "fa-trophy",
  },
  {
    id: "budgets",
    label: "¿Cumplí mis presupuestos?",
    icon: "fa-list-check",
  },
  {
    id: "improve",
    label: "¿Cómo mejorar mis finanzas?",
    icon: "fa-lightbulb",
  },
];

interface MonthStats {
  income: number;
  expense: number;
  debt: number;
  balance: number;
}

function getMonthStats(
  transactions: Transaction[],
  month: number,
  year: number,
): MonthStats {
  const monthTransactions = getMonthTransactions(transactions, month, year);
  const income = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const debt = monthTransactions
    .filter((t) => t.type === "debt")
    .reduce((s, t) => s + (t.debtPaidAmount ?? 0), 0);
  return { income, expense, debt, balance: income - expense - debt };
}

function fmt(amount: number, currency: string): string {
  const abs = Math.abs(amount).toLocaleString("es", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${abs}`;
}

function topCategories(
  transactions: Transaction[],
  limit = 3,
): { id: string; name: string; amount: number; pct: number }[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const map: Record<string, number> = {};
  expenses.forEach((t) => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, amount]) => ({
      id,
      name: getCategoryById(id).name,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }));
}

export function getAnswer(
  questionId: AdvisorQuestionId,
  transactions: Transaction[],
  month: number,
  year: number,
  currency: string,
  budgets: Record<string, number>,
): string {
  const stats = getMonthStats(transactions, month, year);
  const monthName = MONTH_NAMES[month];

  switch (questionId) {
    case "overview":
      return overviewAnswer(stats, monthName, currency);
    case "compare":
      return compareAnswer(transactions, month, year, stats, currency);
    case "topSpending":
      return topSpendingAnswer(transactions, month, year, currency);
    case "budgets":
      return budgetsAnswer(transactions, month, year, budgets, currency);
    case "improve":
      return improveAnswer(transactions, month, year, stats, budgets);
    default:
      return "";
  }
}

function overviewAnswer(stats: MonthStats, monthName: string, currency: string) {
  const lines: string[] = [
    `En ${monthName} tuviste un balance de ${stats.balance >= 0 ? "positivo" : "negativo"}: ${fmt(stats.balance, currency)}.`,
    `Ingresos: ${fmt(stats.income, currency)}.`,
    `Gastos: ${fmt(stats.expense, currency)}.`,
  ];

  if (stats.debt > 0) {
    lines.push(`Abonaste ${fmt(stats.debt, currency)} a tus deudas.`);
  }

  if (stats.income > 0) {
    const savingsRate = ((stats.income - stats.expense) / stats.income) * 100;
    lines.push(
      `Tu tasa de ahorro fue del ${Math.max(savingsRate, 0).toFixed(1)}% sobre tus ingresos.`,
    );
  }

  if (stats.expense > stats.income) {
    lines.push(
      "Ojo: gastaste más de lo que ingresaste. Es momento de recortar gastos.",
    );
  }

  return lines.join("\n");
}

function compareAnswer(
  transactions: Transaction[],
  month: number,
  year: number,
  current: MonthStats,
  currency: string,
) {
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }

  const prevStats = getMonthStats(transactions, prevMonth, prevYear);

  if (prevStats.income === 0 && prevStats.expense === 0) {
    return "No hay registros del mes anterior para comparar todavía. ¡Empieza a registrar para ver tu evolución!";
  }

  const diff = current.expense - prevStats.expense;
  const pct =
    prevStats.expense > 0 ? (Math.abs(diff) / prevStats.expense) * 100 : 0;

  const lines: string[] = [
    `Gastos este mes: ${fmt(current.expense, currency)} vs ${fmt(prevStats.expense, currency)} del mes anterior.`,
  ];

  if (diff < 0) {
    lines.push(
      `¡Bien! Gastaste ${fmt(Math.abs(diff), currency)} menos (${pct.toFixed(0)}% de reducción).`,
    );
  } else if (diff > 0) {
    lines.push(
      `Subiste tus gastos ${fmt(diff, currency)} (${pct.toFixed(0)}% más que el mes pasado).`,
    );
  } else {
    lines.push("Mantuviste tus gastos igual que el mes anterior.");
  }

  const balanceDiff = current.balance - prevStats.balance;
  lines.push(
    `Tu balance fue de ${fmt(current.balance, currency)}, ${balanceDiff >= 0 ? "mejor" : "peor"} por ${fmt(Math.abs(balanceDiff), currency)} frente al mes anterior.`,
  );

  return lines.join("\n");
}

function topSpendingAnswer(
  transactions: Transaction[],
  month: number,
  year: number,
  currency: string,
) {
  const top = topCategories(getMonthTransactions(transactions, month, year));
  if (top.length === 0) {
    return "No registraste gastos este mes todavía.";
  }

  const lines = top.map(
    (cat, idx) =>
      `${idx + 1}. ${cat.name}: ${fmt(cat.amount, currency)} (${cat.pct.toFixed(0)}%)`,
  );

  lines.push(`En total gastaste ${fmt(top.reduce((s, c) => s + c.amount, 0), currency)} este mes.`);

  if (top[0].pct > 50) {
    lines.push(
      `${top[0].name} concentra más de la mitad de tus gastos. Revisa si puedes reducirlo.`,
    );
  }

  return lines.join("\n");
}

function budgetsAnswer(
  transactions: Transaction[],
  month: number,
  year: number,
  budgets: Record<string, number>,
  currency: string,
) {
  const entries = Object.entries(budgets).filter(([, b]) => b > 0);
  if (entries.length === 0) {
    return "Aún no defines presupuestos. Configúralos en la sección de presupuestos para un mejor control.";
  }

  const expenses = getMonthTransactions(
    transactions,
    month,
    year,
  ).filter((t) => t.type === "expense");
  const lines: string[] = [];
  let exceeded = 0;

  entries.forEach(([id, budget]) => {
    const spent = expenses
      .filter((t) => t.category === id)
      .reduce((s, t) => s + t.amount, 0);
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    const name = getCategoryById(id).name;
    if (pct > 100) {
      exceeded += 1;
      lines.push(`⚠ ${name}: excediste tu presupuesto (${fmt(spent, currency)} / ${fmt(budget, currency)}).`);
    } else if (pct > 75) {
      lines.push(`${name}: vas al ${pct.toFixed(0)}% de tu presupuesto (${fmt(spent, currency)}).`);
    }
  });

  if (lines.length === 0) {
    lines.push("Estás dentro de todos tus presupuestos. ¡Excelente control! 👏");
  } else if (exceeded > 0) {
    lines.push(`Tienes ${exceeded} presupuesto(s) excedido(s) este mes. Revisa esas categorías.`);
  }

  return lines.join("\n");
}

function improveAnswer(
  transactions: Transaction[],
  month: number,
  year: number,
  stats: MonthStats,
  budgets: Record<string, number>,
) {
  const tips: string[] = [];

  if (stats.expense > stats.income) {
    tips.push("Estás gastando más de lo que ganas. Prioriza cortar gastos no esenciales.");
  } else if (stats.income > 0) {
    const rate = ((stats.income - stats.expense) / stats.income) * 100;
    if (rate < 10) {
      tips.push("Tu margen de ahorro es bajo (menos del 10%). Intenta ahorrar al menos un 10-20% de tus ingresos.");
    } else {
      tips.push("Vas bien con tu ahorro. Considera mantener una tasa de ahorro constante de al menos 20%.");
    }
  }

  const top = topCategories(getMonthTransactions(transactions, month, year), 1);
  if (top.length > 0 && top[0].pct > 40) {
    tips.push(`Tu mayor gasto (${top[0].name}) representa el ${top[0].pct.toFixed(0)}% del total. Busca reducir ese rubro.`);
  }

  const debts = getMonthTransactions(transactions, month, year).filter(
    (t) => t.type === "debt" && t.debtStatus !== "paid",
  );
  if (debts.length > 0) {
    tips.push(`Tienes ${debts.length} deuda(s) pendiente(s). Prioriza pagarlas antes de gastar en ocio.`);
  }

  const hasBudgets = Object.values(budgets).some((b) => b > 0);
  if (!hasBudgets) {
    tips.push("Define presupuestos por categoría: te ayudarán a controlar el gasto automáticamente.");
  }

  const prevMonth = month - 1 < 0 ? 11 : month - 1;
  const prevYear = month - 1 < 0 ? year - 1 : year;
  const prevExpense = getMonthStats(transactions, prevMonth, prevYear).expense;
  if (prevExpense > 0 && stats.expense > prevExpense) {
    tips.push("Tu gasto subió respecto al mes anterior. Identifica qué categoría creció más.");
  }

  tips.push("Consejo simple: registra cada gasto y revisa tus estadísticas una vez por semana.");

  return tips.map((tip, i) => `${i + 1}. ${tip}`).join("\n");
}
