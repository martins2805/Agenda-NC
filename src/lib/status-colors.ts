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

export const PRIORIDADE_STYLES: Record<Prioridade, string> = {
  Urgente: "bg-[var(--prioridade-urgente)] text-white",
  Importante: "bg-[var(--prioridade-importante)] text-white",
  Médio: "bg-[var(--prioridade-medio)] text-white",
  Baixo: "bg-[var(--prioridade-baixo)] text-white",
};

// Status geral usado em Atividade Geral e nos itens de checklist geral.
export const STATUS_GERAL_STYLES: Record<"Concluído" | "Pendente" | "Em andamento", string> = {
  Concluído: "bg-[var(--status-concluido)] text-white",
  Pendente: "bg-[var(--status-pendente)] text-white",
  "Em andamento": "bg-[var(--status-em-andamento)] text-white",
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
  na: "bg-[var(--negociacao-na)] text-white",
};

