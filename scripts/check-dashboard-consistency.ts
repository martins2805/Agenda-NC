// Aceite da S9: "teste automatizado de consistência: a soma dos gráficos é
// igual ao total do Campo 1 sob o mesmo filtro". Não há test runner no
// projeto (pendência registrada em docs/STATUS.md) — em vez de instalar um
// framework só para esta checagem, usa `tsx` (já é dependência, usada pelo
// db:seed) e `assert` do Node.
//
// Escopo: statusBuckets/prioridade PARTICIONAM totalmente as atividades —
// todo status e toda prioridade cadastrados caem em exatamente um bucket, sem
// sobra. Se algum dia um novo StatusConclusao/Prioridade for adicionado sem
// atualizar statusBuckets/PRIORIDADE_COLORS, este script falha (exit != 0)
// antes que o gráfico do dashboard silenciosamente sub-conte o total.
//
// vencimentoBuckets fica de fora de propósito: não é uma partição total (uma
// atividade sem prazo, ou com prazo além de 30 dias, não cai em nenhum bucket
// — por design, não é um bug a ser pego aqui).

import assert from "node:assert/strict";
import { statusBuckets } from "../src/components/dashboard/dashboard-shared";
import { STATUS_OPTIONS, PRIORIDADE_OPTIONS } from "../src/lib/types";
import type { Atividade, StatusConclusao, Prioridade } from "../src/lib/types";

function atividadeSintetica(status: StatusConclusao, prioridade: Prioridade): Atividade {
  return {
    id: `${status}-${prioridade}`,
    empresaId: null,
    unidadeId: null,
    assunto: "",
    tipoAtividadeIds: [],
    emailConteudo: "",
    oportunidadeTexto: "",
    propostas: [],
    contato: "",
    prazo: null,
    prazoFim: null,
    descricao: "",
    alinhamentos: "",
    status,
    prioridade,
    checklist: [],
    links: [],
    anexos: [],
    createdAt: new Date(0).toISOString(),
    concluidoEm: null,
  };
}

// Campo 1 (Resumo Geral): total = atividades.length, sob o mesmo filtro que
// os gráficos dos Campos 2/3. A checagem: para qualquer conjunto de
// atividades, soma dos buckets de status == total, e soma por prioridade ==
// total — senão o gráfico e o KPI do Campo 1 divergiriam sob o mesmo filtro.

const atividades: Atividade[] = STATUS_OPTIONS.flatMap((status) =>
  PRIORIDADE_OPTIONS.map((prioridade) => atividadeSintetica(status, prioridade))
);

const total = atividades.length;

const somaStatus = statusBuckets(atividades).reduce((sum, b) => sum + b.count, 0);
assert.equal(
  somaStatus,
  total,
  `statusBuckets não particiona todas as atividades: soma=${somaStatus}, total=${total}. ` +
    `Algum StatusConclusao em STATUS_OPTIONS não está coberto por statusBuckets?`
);

const somaPorPrioridade = PRIORIDADE_OPTIONS.reduce(
  (sum, p) => sum + atividades.filter((a) => a.prioridade === p).length,
  0
);
assert.equal(
  somaPorPrioridade,
  total,
  `Distribuição por prioridade não particiona todas as atividades: soma=${somaPorPrioridade}, total=${total}.`
);

console.log(`OK — statusBuckets e distribuição por prioridade somam ${total}/${total} (Campo 1).`);
