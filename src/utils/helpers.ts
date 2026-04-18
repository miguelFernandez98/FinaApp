import { CATEGORIES } from "../data/categories";
import type { Category } from "../types";

export function formatMoney(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  return (
    currency +
    abs.toLocaleString("es", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function getCatById(id: string) {
  return (
    CATEGORIES.find((c: Category) => c.id === id) ||
    CATEGORIES[CATEGORIES.length - 1]
  );
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 18) return "Buenas tardes";
  return "Buenas noches";
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
