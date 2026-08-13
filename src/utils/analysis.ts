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

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
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
  const balanceWord = stats.balance >= 0 ? "positivo" : "negativo";
  const lines: string[] = [
    pick([
      `En ${monthName} tu balance quedó ${balanceWord}: ${fmt(stats.balance, currency)}.`,
      `Vamos con el resumen de ${monthName}: balance ${balanceWord} de ${fmt(stats.balance, currency)}.`,
      `Cerraste ${monthName} con un balance ${balanceWord}: ${fmt(stats.balance, currency)}.`,
    ]),
    pick([
      `Ingresos: ${fmt(stats.income, currency)}.`,
      `Entraron ${fmt(stats.income, currency)} por ingresos.`,
      `Registraste ${fmt(stats.income, currency)} de ingresos.`,
    ]),
    pick([
      `Gastos: ${fmt(stats.expense, currency)}.`,
      `Te gastaste ${fmt(stats.expense, currency)} en total.`,
      `Los gastos sumaron ${fmt(stats.expense, currency)}.`,
    ]),
  ];

  if (stats.debt > 0) {
    lines.push(
      pick([
        `Abonaste ${fmt(stats.debt, currency)} a tus deudas.`,
        `Destinaste ${fmt(stats.debt, currency)} al pago de deudas.`,
      ]),
    );
  }

  if (stats.income > 0) {
    const savingsRate = ((stats.income - stats.expense) / stats.income) * 100;
    lines.push(
      pick([
        `Tu tasa de ahorro fue del ${Math.max(savingsRate, 0).toFixed(1)}% sobre tus ingresos.`,
        `Ahorraste alrededor del ${Math.max(savingsRate, 0).toFixed(1)}% de lo que ingresaste.`,
      ]),
    );
  }

  if (stats.expense > stats.income) {
    lines.push(
      pick([
        "Ojo: gastaste más de lo que ingresaste. Es momento de recortar gastos.",
        "Cuidado: los gastos superaron a los ingresos. Toca ajustar un poco el presupuesto.",
        "Alerta: cerraste en números rojos este mes. Revisa tus gastos fijos.",
      ]),
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
    return pick([
      "No hay registros del mes anterior para comparar todavía. ¡Empieza a registrar para ver tu evolución!",
      "Todavía no tengo datos del mes pasado para comparar. Registra tus movimientos y en un mes podré analizarte.",
      "El mes anterior está vacío, así que no hay nada que comparar por ahora. ¡A registrar!",
    ]);
  }

  const diff = current.expense - prevStats.expense;
  const pct =
    prevStats.expense > 0 ? (Math.abs(diff) / prevStats.expense) * 100 : 0;

  const lines: string[] = [
    pick([
      `Gastos este mes: ${fmt(current.expense, currency)} vs ${fmt(prevStats.expense, currency)} del mes anterior.`,
      `Este mes gastaste ${fmt(current.expense, currency)}, frente a ${fmt(prevStats.expense, currency)} el mes pasado.`,
      `Comparando con el mes anterior (${fmt(prevStats.expense, currency)}), este mes van ${fmt(current.expense, currency)}.`,
    ]),
  ];

  if (diff < 0) {
    lines.push(
      pick([
        `¡Bien! Gastaste ${fmt(Math.abs(diff), currency)} menos (${pct.toFixed(0)}% de reducción).`,
        `Buen trabajo: bajaste tus gastos en ${fmt(Math.abs(diff), currency)} (${pct.toFixed(0)}% menos).`,
        `Excelente, redujiste gastos por ${fmt(Math.abs(diff), currency)} (${pct.toFixed(0)}% respecto al mes pasado).`,
      ]),
    );
  } else if (diff > 0) {
    lines.push(
      pick([
        `Subiste tus gastos ${fmt(diff, currency)} (${pct.toFixed(0)}% más que el mes pasado).`,
        `Cuidado: gastaste ${fmt(diff, currency)} más que el mes anterior (${pct.toFixed(0)}% de aumento).`,
        `Tus gastos crecieron ${fmt(diff, currency)} (${pct.toFixed(0)}% más que el mes pasado).`,
      ]),
    );
  } else {
    lines.push(
      pick([
        "Mantuviste tus gastos igual que el mes anterior.",
        "Ni subiste ni bajaste: gastos idénticos al mes pasado.",
      ]),
    );
  }

  const balanceDiff = current.balance - prevStats.balance;
  lines.push(
    pick([
      `Tu balance fue de ${fmt(current.balance, currency)}, ${balanceDiff >= 0 ? "mejor" : "peor"} por ${fmt(Math.abs(balanceDiff), currency)} frente al mes anterior.`,
      `En cuanto al balance general: ${fmt(current.balance, currency)}, ${balanceDiff >= 0 ? "una mejora" : "una caída"} de ${fmt(Math.abs(balanceDiff), currency)} vs el mes pasado.`,
    ]),
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
    return pick([
      "No registraste gastos este mes todavía.",
      "Aún no hay gastos registrados este mes. ¡Llevas las finanzas en orden!",
      "Este mes todavía no registraste gastos.",
    ]);
  }

  const lines = top.map(
    (cat, idx) =>
      `${idx + 1}. ${cat.name}: ${fmt(cat.amount, currency)} (${cat.pct.toFixed(0)}%)`,
  );

  lines.push(
    pick([
      `En total gastaste ${fmt(top.reduce((s, c) => s + c.amount, 0), currency)} este mes.`,
      `Sumando todo, este mes te gastaste ${fmt(top.reduce((s, c) => s + c.amount, 0), currency)}.`,
    ]),
  );

  if (top[0].pct > 50) {
    lines.push(
      pick([
        `${top[0].name} concentra más de la mitad de tus gastos. Revisa si puedes reducirlo.`,
        `Ojo: ${top[0].name} se lleva más del 50% de tu presupuesto. Evalúa recortarlo.`,
        `Más de la mitad de tus gastos están en ${top[0].name}. Podrías buscar cómo reducirlo.`,
      ]),
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
    return pick([
      "Aún no defines presupuestos. Configúralos en la sección de presupuestos para un mejor control.",
      "No tienes presupuestos definidos todavía. Ponlos en la sección de presupuestos y te ayudarán a controlar el gasto.",
      "Todavía no has creado presupuestos. Te recomiendo definirlos para no perder el control.",
    ]);
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
    lines.push(
      pick([
        "Estás dentro de todos tus presupuestos. ¡Excelente control! 👏",
        "Ningún presupuesto se pasó de la raya. ¡Buen manejo del mes! 👏",
        "Todo bajo control: cumpliste todos tus presupuestos. ¡Sigue así! 💪",
      ]),
    );
  } else if (exceeded > 0) {
    lines.push(
      pick([
        `Tienes ${exceeded} presupuesto(s) excedido(s) este mes. Revisa esas categorías.`,
        `Se te pasaron ${exceeded} presupuesto(s). Vale la pena revisar esas categorías.`,
      ]),
    );
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
    tips.push(
      pick([
        "Estás gastando más de lo que ganas. Prioriza cortar gastos no esenciales.",
        "Tus gastos superan tus ingresos. Recorta lo que no sea esencial.",
        "Vas en números rojos este mes: identifica los gastos que puedes eliminar.",
      ]),
    );
  } else if (stats.income > 0) {
    const rate = ((stats.income - stats.expense) / stats.income) * 100;
    if (rate < 10) {
      tips.push(
        pick([
          "Tu margen de ahorro es bajo (menos del 10%). Intenta ahorrar al menos un 10-20% de tus ingresos.",
          "Ahorras muy poco de tus ingresos. Busca subir tu margen al 10-20%.",
        ]),
      );
    } else {
      tips.push(
        pick([
          "Vas bien con tu ahorro. Considera mantener una tasa de ahorro constante de al menos 20%.",
          "Tu tasa de ahorro es sana. Mantén al menos el 20% para crecer tu colchón.",
        ]),
      );
    }
  }

  const top = topCategories(getMonthTransactions(transactions, month, year), 1);
  if (top.length > 0 && top[0].pct > 40) {
    tips.push(
      pick([
        `Tu mayor gasto (${top[0].name}) representa el ${top[0].pct.toFixed(0)}% del total. Busca reducir ese rubro.`,
        `${top[0].name} se lleva el ${top[0].pct.toFixed(0)}% de tus gastos. Es buen lugar para recortar.`,
      ]),
    );
  }

  const debts = getMonthTransactions(transactions, month, year).filter(
    (t) => t.type === "debt" && t.debtStatus !== "paid",
  );
  if (debts.length > 0) {
    tips.push(
      pick([
        `Tienes ${debts.length} deuda(s) pendiente(s). Prioriza pagarlas antes de gastar en ocio.`,
        `Hay ${debts.length} deuda(s) sin saldar. Págarlas debería ser tu prioridad.`,
      ]),
    );
  }

  const hasBudgets = Object.values(budgets).some((b) => b > 0);
  if (!hasBudgets) {
    tips.push(
      pick([
        "Define presupuestos por categoría: te ayudarán a controlar el gasto automáticamente.",
        "Crea presupuestos por categoría para no perder el control del gasto.",
      ]),
    );
  }

  const prevMonth = month - 1 < 0 ? 11 : month - 1;
  const prevYear = month - 1 < 0 ? year - 1 : year;
  const prevExpense = getMonthStats(transactions, prevMonth, prevYear).expense;
  if (prevExpense > 0 && stats.expense > prevExpense) {
    tips.push(
      pick([
        "Tu gasto subió respecto al mes anterior. Identifica qué categoría creció más.",
        "Gastaste más que el mes pasado. Revisa cuál categoría se disparó.",
      ]),
    );
  }

  tips.push(
    pick([
      "Consejo simple: registra cada gasto y revisa tus estadísticas una vez por semana.",
      "Mi mejor recomendación: anota todos los gastos y repasa tus números cada semana.",
      "Tip final: registra todo y revisa tus estadísticas semanalmente.",
    ]),
  );

  return tips.map((tip, i) => `${i + 1}. ${tip}`).join("\n");
}
