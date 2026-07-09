import type {
  Atividade as DbAtividade,
  Proposta as DbProposta,
  ChecklistItem as DbChecklistItem,
  StatusConclusao as DbStatus,
  Prioridade as DbPrioridade,
} from "@/generated/prisma/client";
import type { Atividade, Proposta, ChecklistItem, StatusConclusao, Prioridade } from "@/lib/types";

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
    assuntoId: a.assuntoId,
    tipoAtividadeIds: a.tipoAtividadeIds,
    emailConteudo: a.emailConteudo,
    oportunidadeTexto: a.oportunidadeTexto,
    contato: a.contato,
    prazo: a.prazo ? a.prazo.toISOString().slice(0, 10) : null,
    descricao: a.descricao,
    status: STATUS_FROM_DB[a.status],
    prioridade: PRIORIDADE_FROM_DB[a.prioridade],
    createdAt: a.createdAt.toISOString(),
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
  };
}

function checklistItemFromDb(c: DbChecklistItem): ChecklistItem {
  return { id: c.id, texto: c.texto, concluido: c.concluido };
}
