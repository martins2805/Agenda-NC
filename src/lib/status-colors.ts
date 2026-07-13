import type { Atividade, Prioridade, StatusConclusao, StatusNegociacao } from "./types";
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
  Concluído: "#998731",
  Pendente: "#bf512c",
  "Aguardando retorno interno": "#3e4c59",
  "Aguardando retorno cliente": "#3e4c59",
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
  Médio: "#3e4c59",
  Baixo: "#998731",
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

// Status de negociação da proposta — cores fixas por especificação.
export const STATUS_NEGOCIACAO_STYLES: Record<StatusNegociacao, string> = {
  em_andamento: "bg-[var(--negociacao-em-andamento)] text-white",
  fup: "bg-[var(--negociacao-fup)] text-white",
  aceite: "bg-[var(--negociacao-aceite)] text-white",
  na: "bg-[var(--negociacao-na)] text-[var(--base-1)]",
};

export const STATUS_NEGOCIACAO_HEX: Record<StatusNegociacao, string> = {
  em_andamento: "#da9b2b",
  fup: "#bf512c",
  aceite: "#2e5749",
  na: "#d8d8d8",
};
