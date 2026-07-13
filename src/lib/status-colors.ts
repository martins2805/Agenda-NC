import type { Atividade, Prioridade, StatusConclusao } from "./types";
import { parseLocalDate } from "./calculations";

// Secondary (business-rule) palette — used exclusively for status, priority and
// deadline indicators across the app (dashboard, cards, badges, calendar, charts).
export const STATUS_STYLES: Record<StatusConclusao, string> = {
  Concluído: "bg-[var(--status-concluido)] text-white",
  Pendente: "bg-[var(--status-pendente)] text-white",
  "Aguardando retorno interno": "bg-[var(--status-outro)] text-white",
  "Aguardando retorno cliente": "bg-[var(--status-outro)] text-white",
};

export const STATUS_HEX: Record<StatusConclusao, string> = {
  Concluído: "#2e5749",
  Pendente: "#bf512c",
  "Aguardando retorno interno": "#da9b2b",
  "Aguardando retorno cliente": "#da9b2b",
};

export const PRIORIDADE_STYLES: Record<Prioridade, string> = {
  Urgente: "bg-[var(--prioridade-urgente)] text-white",
  Importante: "bg-[var(--prioridade-importante)] text-white",
  Médio: "bg-[var(--prioridade-medio)] text-white",
  Baixo: "bg-[var(--prioridade-baixo)] text-white",
};

export const PRIORIDADE_HEX: Record<Prioridade, string> = {
  Urgente: "#780001",
  Importante: "#bf512c",
  Médio: "#da9b2b",
  Baixo: "#2e5749",
};

export type PrazoStatus = "em-dia" | "proximo" | "vencido";

export const PRAZO_STYLES: Record<PrazoStatus, string> = {
  "em-dia": "bg-[var(--prazo-em-dia)] text-white",
  proximo: "bg-[var(--prazo-proximo)] text-white",
  vencido: "bg-[var(--prazo-vencido)] text-white",
};

export const PRAZO_LABELS: Record<PrazoStatus, string> = {
  "em-dia": "Em dia",
  proximo: "Perto do vencimento",
  vencido: "Vencido",
};

export function prazoStatusFor(prazo: string | null): PrazoStatus | null {
  if (!prazo) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (parseLocalDate(prazo).getTime() - today.getTime()) / 86400000
  );
  if (diffDays < 0) return "vencido";
  if (diffDays <= 2) return "proximo";
  return "em-dia";
}

export function atividadePrazoStatus(
  atividade: Pick<Atividade, "prazo" | "status">
): PrazoStatus | null {
  if (atividade.status === "Concluído") return null;
  return prazoStatusFor(atividade.prazo);
}
