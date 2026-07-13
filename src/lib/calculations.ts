import type { Atividade } from "./types";

export function diasEmPendencia(atividade: Pick<Atividade, "status" | "createdAt">): number | null {
  if (atividade.status === "Concluído") return null;
  const created = new Date(atividade.createdAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

// Days overdue relative to `prazo` (deadline), as opposed to diasEmPendencia
// (days since creation). Returns null when there's no deadline, the deadline
// hasn't passed yet, or the activity is already done.
export function diasEmAtraso(atividade: Pick<Atividade, "status" | "prazo">): number | null {
  if (atividade.status === "Concluído" || !atividade.prazo) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const prazo = parseLocalDate(atividade.prazo);
  const diffDays = Math.floor((today.getTime() - prazo.getTime()) / 86400000);
  return diffDays > 0 ? diffDays : null;
}

// "YYYY-MM-DD" has no timezone info, so `new Date(str)` parses it as UTC
// midnight — displaying it in a timezone behind UTC then shows the previous
// day. Build the Date from local components instead so it stays put.
// Also accepts the datetime form "YYYY-MM-DDTHH:mm" by only reading the
// date portion (first 10 chars).
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
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

// --- Deadline + time-of-day helpers -----------------------------------
//
// Deadlines may carry an optional time-of-day ("YYYY-MM-DDTHH:mm") in
// addition to the plain date ("YYYY-MM-DD"). To stay independent of the
// server's local timezone, both encode and decode always go through UTC
// components explicitly (Date.UTC / getUTCXxx) — this matches how the old
// date-only values were already stored (`new Date("YYYY-MM-DD")` is UTC
// midnight per the ECMA-262 date-only grammar), so existing records keep
// displaying correctly.

export function dateOnlyPart(value: string): string {
  return value.slice(0, 10);
}

export function hasTimePart(value: string): boolean {
  return value.length > 10 && value[10] === "T" && value.slice(11, 16) !== "00:00";
}

// Parses a "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" input value into the UTC
// instant that should be persisted to the database.
export function localInputToUtcDate(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0));
}

// Inverse of localInputToUtcDate: rebuilds the "YYYY-MM-DD[THH:mm]" input
// value from a stored Date, using UTC components. Omits the time portion
// when it's midnight (interpreted as "no time was specified").
export function utcDateToLocalInputValue(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const datePart = `${y}-${m}-${d}`;
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  if (hh === 0 && mm === 0) return datePart;
  return `${datePart}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Formats a "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" value for display in pt-BR,
// showing the time only when one was actually specified.
export function formatLocalDateTime(value: string): string {
  const datePart = parseLocalDate(value).toLocaleDateString("pt-BR");
  if (!hasTimePart(value)) return datePart;
  return `${datePart} ${value.slice(11, 16)}`;
}
