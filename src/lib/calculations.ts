import type { Atividade } from "./types";

export function diasEmPendencia(atividade: Pick<Atividade, "status" | "createdAt">): number | null {
  if (atividade.status === "Concluído") return null;
  const created = new Date(atividade.createdAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

// "YYYY-MM-DD" has no timezone info, so `new Date(str)` parses it as UTC
// midnight — displaying it in a timezone behind UTC then shows the previous
// day. Build the Date from local components instead so it stays put.
export function parseLocalDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Mirror of parseLocalDate: build today's "YYYY-MM-DD" from local date parts
// instead of `new Date().toISOString()` (which is UTC and rolls over to
// tomorrow's date in the evening for timezones behind UTC, e.g. Brazil).
export function todayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
