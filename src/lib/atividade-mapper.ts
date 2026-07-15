import type {
  AtividadeGeral as DbAtividadeGeral,
  Atividade as DbAtividade,
  Proposta as DbProposta,
  ChecklistItem as DbChecklistItem,
  ChecklistGeralItem as DbChecklistGeralItem,
  StatusConclusao as DbStatus,
  Prioridade as DbPrioridade,
} from "@/generated/prisma/client";
import type {
  Atividade,
  AtividadeGeral,
  ChecklistGeralItem,
  Proposta,
  ChecklistItem,
  StatusConclusao,
  Prioridade,
} from "@/lib/types";

const STATUS_TO_DB: Record<StatusConclusao, DbStatus> = {
  Pendente: "Pendente",
  "Aguardando retorno interno": "AguardandoRetornoInterno",
  "Aguardando retorno cliente": "AguardandoRetornoCliente",
  Concluído: "Concluido",
};

const STATUS_FROM_DB: Record<DbStatus, StatusConclusao> = {
  Pendente: "Pendente",
  AguardandoRetornoInterno: "Aguardando retorno interno",
  AguardandoRetornoCliente: "Aguardando retorno cliente",
  Concluido: "Concluído",
};

const PRIORIDADE_TO_DB: Record<Prioridade, DbPrioridade> = {
  Urgente: "Urgente",
  Importante: "Importante",
  Médio: "Medio",
  Baixo: "Baixo",
};

const PRIORIDADE_FROM_DB: Record<DbPrioridade, Prioridade> = {
  Urgente: "Urgente",
  Importante: "Importante",
  Medio: "Médio",
  Baixo: "Baixo",
};

// Builds a "YYYY-MM-DDTHH:mm" string from the Date's *local* components,
// matching how `new Date("YYYY-MM-DDTHH:mm")` parsed it on write. Using
// `toISOString()` here would convert through UTC and shift the displayed
// time by the server's timezone offset.
function toLocalDateTimeString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function statusToDb(status: StatusConclusao): DbStatus {
  return STATUS_TO_DB[status];
}

export function prioridadeToDb(prioridade: Prioridade): DbPrioridade {
  return PRIORIDADE_TO_DB[prioridade];
}

type FullDbAtividade = DbAtividade & {
  propostas: DbProposta[];
  checklist: DbChecklistItem[];
};

export function atividadeFromDb(a: FullDbAtividade): Atividade {
  return {
    id: a.id,
    empresaId: a.empresaId,
    unidadeId: a.unidadeId,
    assunto: a.assunto,
    tipoAtividadeIds: a.tipoAtividadeIds,
    emailConteudo: a.emailConteudo,
    oportunidadeTexto: a.oportunidadeTexto,
    contato: a.contato,
    prazo: a.prazo ? toLocalDateTimeString(a.prazo) : null,
    descricao: a.descricao,
    alinhamentos: a.alinhamentos,
    status: STATUS_FROM_DB[a.status],
    prioridade: PRIORIDADE_FROM_DB[a.prioridade],
    createdAt: a.createdAt.toISOString(),
    deletedAt: a.deletedAt ? a.deletedAt.toISOString() : null,
    propostas: a.propostas
      .sort((x, y) => x.numero - y.numero)
      .map(propostaFromDb),
    checklist: a.checklist
      .sort((x, y) => x.ordem - y.ordem)
      .map(checklistItemFromDb),
  };
}

function propostaFromDb(p: DbProposta): Proposta {
  return {
    id: p.id,
    numero: p.numero,
    servicoProdutoIds: p.servicoProdutoIds,
    escopoIds: p.escopoIds,
    amostragemIds: p.amostragemIds,
    quantidade: p.quantidade,
    valorUnitario: p.valorUnitario,
    valorTotal: p.valorTotal,
    tipo: p.tipo,
    detalhe: p.detalhe,
    observacao: p.observacao,
    prazoInicio: p.prazoInicio ? p.prazoInicio.toISOString().slice(0, 10) : null,
    prazoFim: p.prazoFim ? p.prazoFim.toISOString().slice(0, 10) : null,
    statusNegociacao: p.statusNegociacao as Proposta["statusNegociacao"],
  };
}

function checklistItemFromDb(c: DbChecklistItem): ChecklistItem {
  return {
    id: c.id,
    texto: c.texto,
    concluido: c.concluido,
    prazo: c.prazo ? c.prazo.toISOString().slice(0, 10) : null,
    parentId: c.parentId,
  };
}

export function orderChecklistForInsert<T extends { parentId?: string | null; ordem: number }>(
  items: T[]
): T[] {
  const byParent = new Map<string | null, T[]>();
  for (const item of items) {
    const key = item.parentId ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), item]);
  }
  const ordered: T[] = [];
  function visit(parentId: string | null) {
    for (const item of (byParent.get(parentId) ?? []).sort((a, b) => a.ordem - b.ordem)) {
      ordered.push(item);
      visit((item as T & { id?: string }).id ?? null);
    }
  }
  visit(null);
  return ordered.map((item, ordem) => ({ ...item, ordem }));
}

type FullDbAtividadeGeral = DbAtividadeGeral & {
  checklist: DbChecklistGeralItem[];
};

export function atividadeGeralFromDb(a: FullDbAtividadeGeral): AtividadeGeral {
  return {
    id: a.id,
    empresaId: a.empresaId,
    unidadeId: a.unidadeId,
    tipoIds: a.tipoIds,
    assunto: a.assunto,
    vinculos: a.vinculos,
    prazo: a.prazo ? a.prazo.toISOString().slice(0, 10) : null,
    descricao: a.descricao,
    status: a.status as AtividadeGeral["status"],
    prioridade: PRIORIDADE_FROM_DB[a.prioridade],
    setorIds: a.setorIds,
    createdAt: a.createdAt.toISOString(),
    checklist: a.checklist
      .sort((x, y) => x.ordem - y.ordem)
      .map(checklistGeralItemFromDb),
  };
}

function checklistGeralItemFromDb(c: DbChecklistGeralItem): ChecklistGeralItem {
  return {
    id: c.id,
    parentId: c.parentId,
    texto: c.texto,
    status: c.status as ChecklistGeralItem["status"],
    prioridade: PRIORIDADE_FROM_DB[c.prioridade],
    prazo: c.prazo ? c.prazo.toISOString().slice(0, 10) : null,
    empresaId: c.empresaId,
    unidadeId: c.unidadeId,
  };
}
