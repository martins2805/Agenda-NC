import type { Atividade } from "./types";

export function diasEmPendencia(atividade: Pick<Atividade, "status" | "createdAt">): number | null {
  if (atividade.status === "Concluído") return null;
  const created = new Date(atividade.createdAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

export function formatCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
