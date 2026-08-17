import { getLanguage, monthName, t } from "../i18n";
import type { Transaction } from "../types";
import { getCategoryById, getMonthTransactions } from "./transactions";

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
    label: t("advisor.q_overview"),
    icon: "fa-chart-pie",
  },
  {
    id: "compare",
    label: t("advisor.q_compare"),
    icon: "fa-scale-balanced",
  },
  {
    id: "topSpending",
    label: t("advisor.q_top_spending"),
    icon: "fa-trophy",
  },
  {
    id: "budgets",
    label: t("advisor.q_budgets"),
    icon: "fa-list-check",
  },
  {
    id: "improve",
    label: t("advisor.q_improve"),
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
  const locale = getLanguage() === "en" ? "en" : "es";
  const abs = Math.abs(amount).toLocaleString(locale, {
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

function monthLabel(month: number): string {
  return monthName(month);
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
  const monthName = monthLabel(month);

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
      t("advisor.overview_line1", { monthName, balanceWord, amount: fmt(stats.balance, currency) }),
      t("advisor.overview_line2", { monthName, balanceWord, amount: fmt(stats.balance, currency) }),
      t("advisor.overview_line3", { monthName, balanceWord, amount: fmt(stats.balance, currency) }),
    ]),
    pick([
      t("advisor.income_line1", { amount: fmt(stats.income, currency) }),
      t("advisor.income_line2", { amount: fmt(stats.income, currency) }),
      t("advisor.income_line3", { amount: fmt(stats.income, currency) }),
    ]),
    pick([
      t("advisor.expense_line1", { amount: fmt(stats.expense, currency) }),
      t("advisor.expense_line2", { amount: fmt(stats.expense, currency) }),
      t("advisor.expense_line3", { amount: fmt(stats.expense, currency) }),
    ]),
  ];

  if (stats.debt > 0) {
    lines.push(
      pick([
        t("advisor.debt_line1", { amount: fmt(stats.debt, currency) }),
        t("advisor.debt_line2", { amount: fmt(stats.debt, currency) }),
      ]),
    );
  }

  if (stats.income > 0) {
    const savingsRate = ((stats.income - stats.expense) / stats.income) * 100;
    lines.push(
      pick([
        t("advisor.savings_line1", { rate: Math.max(savingsRate, 0).toFixed(1) }),
        t("advisor.savings_line2", { rate: Math.max(savingsRate, 0).toFixed(1) }),
      ]),
    );
  }

  if (stats.expense > stats.income) {
    lines.push(
      pick([
        t("advisor.over_line1"),
        t("advisor.over_line2"),
        t("advisor.over_line3"),
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
      t("advisor.compare_empty1"),
      t("advisor.compare_empty2"),
      t("advisor.compare_empty3"),
    ]);
  }

  const diff = current.expense - prevStats.expense;
  const pct =
    prevStats.expense > 0 ? (Math.abs(diff) / prevStats.expense) * 100 : 0;

  const lines: string[] = [
    pick([
      t("advisor.compare_line1", { cur: fmt(current.expense, currency), prev: fmt(prevStats.expense, currency) }),
      t("advisor.compare_line2", { cur: fmt(current.expense, currency), prev: fmt(prevStats.expense, currency) }),
      t("advisor.compare_line3", { prev: fmt(prevStats.expense, currency), cur: fmt(current.expense, currency) }),
    ]),
  ];

  if (diff < 0) {
    lines.push(
      pick([
        t("advisor.compare_less1", { amount: fmt(Math.abs(diff), currency), pct: pct.toFixed(0) }),
        t("advisor.compare_less2", { amount: fmt(Math.abs(diff), currency), pct: pct.toFixed(0) }),
        t("advisor.compare_less3", { amount: fmt(Math.abs(diff), currency), pct: pct.toFixed(0) }),
      ]),
    );
  } else if (diff > 0) {
    lines.push(
      pick([
        t("advisor.compare_more1", { amount: fmt(diff, currency), pct: pct.toFixed(0) }),
        t("advisor.compare_more2", { amount: fmt(diff, currency), pct: pct.toFixed(0) }),
        t("advisor.compare_more3", { amount: fmt(diff, currency), pct: pct.toFixed(0) }),
      ]),
    );
  } else {
    lines.push(
      pick([
        t("advisor.compare_same1"),
        t("advisor.compare_same2"),
      ]),
    );
  }

  const balanceDiff = current.balance - prevStats.balance;
  lines.push(
    pick([
      t("advisor.balance_diff1", { cur: fmt(current.balance, currency), word: balanceDiff >= 0 ? t("advisor.better") : t("advisor.worse"), amount: fmt(Math.abs(balanceDiff), currency) }),
      t("advisor.balance_diff2", { cur: fmt(current.balance, currency), word: balanceDiff >= 0 ? t("advisor.improvement") : t("advisor.drop"), amount: fmt(Math.abs(balanceDiff), currency) }),
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
      t("advisor.top_empty1"),
      t("advisor.top_empty2"),
      t("advisor.top_empty3"),
    ]);
  }

  const lines = top.map(
    (cat, idx) =>
      `${idx + 1}. ${cat.name}: ${fmt(cat.amount, currency)} (${cat.pct.toFixed(0)}%)`,
  );

  lines.push(
    pick([
      t("advisor.top_total1", { amount: fmt(top.reduce((s, c) => s + c.amount, 0), currency) }),
      t("advisor.top_total2", { amount: fmt(top.reduce((s, c) => s + c.amount, 0), currency) }),
    ]),
  );

  if (top[0].pct > 50) {
    lines.push(
      pick([
        t("advisor.top_dominant1", { name: top[0].name }),
        t("advisor.top_dominant2", { name: top[0].name }),
        t("advisor.top_dominant3", { name: top[0].name }),
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
      t("advisor.budget_empty1"),
      t("advisor.budget_empty2"),
      t("advisor.budget_empty3"),
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
      lines.push(t("advisor.budget_exceeded", { name, spent: fmt(spent, currency), budget: fmt(budget, currency) }));
    } else if (pct > 75) {
      lines.push(t("advisor.budget_approaching", { name, pct: pct.toFixed(0), spent: fmt(spent, currency) }));
    }
  });

  if (lines.length === 0) {
    lines.push(
      pick([
        t("advisor.budget_ok1"),
        t("advisor.budget_ok2"),
        t("advisor.budget_ok3"),
      ]),
    );
  } else if (exceeded > 0) {
    lines.push(
      pick([
        t("advisor.budget_exceeded_summary1", { count: exceeded }),
        t("advisor.budget_exceeded_summary2", { count: exceeded }),
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
        t("advisor.improve_over1"),
        t("advisor.improve_over2"),
        t("advisor.improve_over3"),
      ]),
    );
  } else if (stats.income > 0) {
    const rate = ((stats.income - stats.expense) / stats.income) * 100;
    if (rate < 10) {
      tips.push(
        pick([
          t("advisor.improve_low1"),
          t("advisor.improve_low2"),
        ]),
      );
    } else {
      tips.push(
        pick([
          t("advisor.improve_ok1"),
          t("advisor.improve_ok2"),
        ]),
      );
    }
  }

  const top = topCategories(getMonthTransactions(transactions, month, year), 1);
  if (top.length > 0 && top[0].pct > 40) {
    tips.push(
      pick([
        t("advisor.improve_top1", { name: top[0].name, pct: top[0].pct.toFixed(0) }),
        t("advisor.improve_top2", { name: top[0].name, pct: top[0].pct.toFixed(0) }),
      ]),
    );
  }

  const debts = getMonthTransactions(transactions, month, year).filter(
    (t) => t.type === "debt" && t.debtStatus !== "paid",
  );
  if (debts.length > 0) {
    tips.push(
      pick([
        t("advisor.improve_debts1", { count: debts.length }),
        t("advisor.improve_debts2", { count: debts.length }),
      ]),
    );
  }

  const hasBudgets = Object.values(budgets).some((b) => b > 0);
  if (!hasBudgets) {
    tips.push(
      pick([
        t("advisor.improve_budgets1"),
        t("advisor.improve_budgets2"),
      ]),
    );
  }

  const prevMonth = month - 1 < 0 ? 11 : month - 1;
  const prevYear = month - 1 < 0 ? year - 1 : year;
  const prevExpense = getMonthStats(transactions, prevMonth, prevYear).expense;
  if (prevExpense > 0 && stats.expense > prevExpense) {
    tips.push(
      pick([
        t("advisor.improve_increase1"),
        t("advisor.improve_increase2"),
      ]),
    );
  }

  tips.push(
    pick([
      t("advisor.improve_final1"),
      t("advisor.improve_final2"),
      t("advisor.improve_final3"),
    ]),
  );

  return tips.map((tip, i) => `${i + 1}. ${tip}`).join("\n");
}