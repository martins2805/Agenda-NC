import type {
  Atividade as DbAtividade,
  Proposta as DbProposta,
  ChecklistItem as DbChecklistItem,
  StatusConclusao as DbStatus,
  Prioridade as DbPrioridade,
} from "@/generated/prisma/client";
import type {
  Atividade,
  Proposta,
  ChecklistItem,
  StatusConclusao,
  Prioridade,
  TipoProposta,
  StatusNegociacao,
} from "@/lib/types";
import { utcDateToLocalInputValue } from "@/lib/calculations";

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
    prazo: a.prazo ? utcDateToLocalInputValue(a.prazo) : null,
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
    tipo: (p.tipo as TipoProposta | null) ?? null,
    servicoProdutoIds: p.servicoProdutoIds,
    detalhe: p.detalhe,
    escopoIds: p.escopoIds,
    amostragemIds: p.amostragemIds,
    quantidade: p.quantidade,
    valorUnitario: p.valorUnitario,
    valorTotal: p.valorTotal,
    observacao: p.observacao,
    prazoInicio: p.prazoInicio ? utcDateToLocalInputValue(p.prazoInicio) : null,
    prazoFim: p.prazoFim ? utcDateToLocalInputValue(p.prazoFim) : null,
    statusNegociacao: (p.statusNegociacao as StatusNegociacao | null) ?? null,
  };
}

// Self-referencing FK inserts must see the parent row before the child row.
// The UI always appends a subitem right after its parent, but this sorts
// defensively (topological order) so nested creates never violate the FK
// regardless of how the array ended up ordered.
export function orderChecklistForInsert<T extends { id: string; parentId: string | null }>(
  items: T[]
): T[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered: T[] = [];
  const seen = new Set<string>();

  function visit(item: T) {
    if (seen.has(item.id)) return;
    const parent = item.parentId ? byId.get(item.parentId) : undefined;
    if (parent && !seen.has(parent.id)) visit(parent);
    seen.add(item.id);
    ordered.push(item);
  }

  items.forEach(visit);
  return ordered;
}

function checklistItemFromDb(c: DbChecklistItem): ChecklistItem {
  return {
    id: c.id,
    texto: c.texto,
    concluido: c.concluido,
    prazo: c.prazo ? utcDateToLocalInputValue(c.prazo) : null,
    parentId: c.parentId ?? null,
  };
}
