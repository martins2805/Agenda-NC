-- PROMPT 3, item 4.1: o campo Prazo da atividade passa a ter tres modalidades
-- que coexistem — Entrega (data unica), Janela (periodo de execucao) e
-- Recorrente (ocorrencias periodicas). Recorrente NAO substitui as outras.
--
-- Ate aqui a "janela" existia de forma acidental: prazoFim so aparecia no
-- formulario quando o tipo de atividade se chamava literalmente "Agendamento"
-- (match por string em activity-form.tsx) e NUNCA entrava em prazo_unificado —
-- ou seja, a data final da janela era invisivel no calendario. Esta migration
-- desacopla a modalidade do nome do tipo e leva Atividade."prazoFim" para a
-- fonte unica de prazos.
--
-- A view prazo_unificado precisa de DROP + CREATE (e nao CREATE OR REPLACE):
-- o bloco de Atividade deixa de produzir 1 linha por atividade e passa a
-- produzir 1, 2 (janela) ou N (recorrencia) linhas — licao da S1/S7 sobre
-- redefinicao de view ja registrada em docs/STATUS.md.
--
-- IDEMPOTENTE (licao da S1): seguro rodar de novo sobre estado parcial.

-- 1. Tipos enum novos

DO $$ BEGIN
  CREATE TYPE "ModalidadePrazo" AS ENUM ('Entrega', 'Janela', 'Recorrente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RecorrenciaFrequencia" AS ENUM ('Diaria', 'Semanal', 'Mensal', 'Anual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Colunas novas em Atividade

ALTER TABLE "Atividade"
  ADD COLUMN IF NOT EXISTS "modalidadePrazo" "ModalidadePrazo" NOT NULL DEFAULT 'Entrega';

ALTER TABLE "Atividade"
  ADD COLUMN IF NOT EXISTS "recorrenciaFreq" "RecorrenciaFrequencia";

ALTER TABLE "Atividade"
  ADD COLUMN IF NOT EXISTS "recorrenciaCada" INTEGER;

ALTER TABLE "Atividade"
  ADD COLUMN IF NOT EXISTS "recorrenciaAte" TIMESTAMP(3);

-- 3. Backfill: quem ja tinha prazoFim preenchido era, de fato, uma janela de
-- execucao (agendamento). Preserva o dado existente em vez de descarta-lo.
-- So mexe em linhas ainda no default, para nao sobrescrever escolha do usuario
-- caso a migration rode de novo.

UPDATE "Atividade"
SET "modalidadePrazo" = 'Janela'
WHERE "prazoFim" IS NOT NULL
  AND "prazo" IS NOT NULL
  AND "modalidadePrazo" = 'Entrega';

-- 4. Recria a view. Mesma ordem de colunas de 20260818150000 (colunas novas
-- so ao final, se houvesse) — aqui nenhuma coluna muda de nome ou tipo; o que
-- muda e o conjunto de linhas produzido pelo bloco de Atividade.

DROP VIEW IF EXISTS prazo_unificado;

CREATE VIEW prazo_unificado AS
  -- Prazo de entrega/execucao: uma unica data limite.
  SELECT
    a."userId" AS user_id, 'atividade' AS objeto_tipo, a."id" AS objeto_id,
    'atividade' AS origem_tipo, a."assunto" AS titulo, a."empresaId" AS empresa_id,
    a."unidadeIds" AS unidade_id, a."prazo" AS data, a."prioridade"::text AS prioridade,
    a."status"::text AS status, 'atividade' AS tipo_prazo,
    a."id" AS origem_id, a."tipoAtividadeIds" AS tipo_atividade_ids
  FROM "Atividade" a
  WHERE a."prazo" IS NOT NULL AND a."deletedAt" IS NULL
    AND a."modalidadePrazo" = 'Entrega'
UNION ALL
  -- Janela de execucao: abre no inicio...
  SELECT
    a."userId", 'atividade', a."id",
    'atividade', a."assunto", a."empresaId", a."unidadeIds",
    a."prazo", a."prioridade"::text, a."status"::text,
    'janelaInicio', a."id" || '#inicio', a."tipoAtividadeIds"
  FROM "Atividade" a
  WHERE a."prazo" IS NOT NULL AND a."deletedAt" IS NULL
    AND a."modalidadePrazo" = 'Janela'
UNION ALL
  -- ...e fecha no fim. Ate esta migration, este lado nao existia na view.
  SELECT
    a."userId", 'atividade', a."id",
    'atividade', a."assunto", a."empresaId", a."unidadeIds",
    a."prazoFim", a."prioridade"::text, a."status"::text,
    'janelaFim', a."id" || '#fim', a."tipoAtividadeIds"
  FROM "Atividade" a
  WHERE a."prazoFim" IS NOT NULL AND a."deletedAt" IS NULL
    AND a."modalidadePrazo" = 'Janela'
UNION ALL
  -- Prazo recorrente: uma linha por ocorrencia, geradas a partir da regra.
  -- Horizonte maximo de 2 anos a frente do inicio, mesmo sem data de termino,
  -- para a view nao virar infinita. origem_id carrega a data da ocorrencia,
  -- para cada uma ter chave propria.
  SELECT
    a."userId", 'atividade', a."id",
    'atividade', a."assunto", a."empresaId", a."unidadeIds",
    occ.data, a."prioridade"::text, a."status"::text,
    'recorrente', a."id" || '#' || to_char(occ.data, 'YYYYMMDDHH24MI'), a."tipoAtividadeIds"
  FROM "Atividade" a
  CROSS JOIN LATERAL generate_series(
    a."prazo",
    LEAST(
      COALESCE(a."recorrenciaAte", a."prazo" + INTERVAL '2 years'),
      a."prazo" + INTERVAL '2 years'
    ),
    (GREATEST(COALESCE(a."recorrenciaCada", 1), 1)::text || ' ' ||
      CASE a."recorrenciaFreq"
        WHEN 'Diaria'  THEN 'days'
        WHEN 'Semanal' THEN 'weeks'
        WHEN 'Mensal'  THEN 'months'
        ELSE 'years'
      END)::interval
  ) AS occ(data)
  WHERE a."prazo" IS NOT NULL AND a."deletedAt" IS NULL
    AND a."modalidadePrazo" = 'Recorrente'
    AND a."recorrenciaFreq" IS NOT NULL
UNION ALL
  SELECT
    a."userId", 'atividade', a."id",
    'checklist', c."texto", a."empresaId", a."unidadeIds",
    c."prazo", a."prioridade"::text,
    CASE WHEN c."concluido" THEN 'Concluido' ELSE 'Pendente' END,
    'checklist', c."id", a."tipoAtividadeIds"
  FROM "ChecklistItem" c
  JOIN "Atividade" a ON a."id" = c."atividadeId"
  WHERE c."prazo" IS NOT NULL AND a."deletedAt" IS NULL
UNION ALL
  SELECT
    g."userId", 'atividadeGeral', g."id",
    'atividadeGeral', g."assunto", g."empresaId", g."unidadeIds",
    g."prazo", g."prioridade"::text, g."status",
    'atividade', g."id", NULL
  FROM "AtividadeGeral" g
  WHERE g."prazo" IS NOT NULL
UNION ALL
  SELECT
    g."userId", 'atividadeGeral', g."id",
    'checklist', ci."texto",
    ci."empresaId",
    CASE WHEN ci."unidadeId" IS NULL THEN ARRAY[]::text[] ELSE ARRAY[ci."unidadeId"] END,
    ci."prazo", ci."prioridade"::text, ci."status"::text,
    'checklist', ci."id", NULL
  FROM "ChecklistGeralItem" ci
  JOIN "AtividadeGeral" g ON g."id" = ci."atividadeGeralId"
  WHERE ci."prazo" IS NOT NULL
UNION ALL
  SELECT
    a."userId", 'atividade', a."id",
    'proposta', a."assunto", a."empresaId", a."unidadeIds",
    p."prazoFim", a."prioridade"::text, a."status"::text,
    'proposta', p."id", a."tipoAtividadeIds"
  FROM "Proposta" p
  JOIN "Atividade" a ON a."id" = p."atividadeId"
  WHERE p."prazoFim" IS NOT NULL AND a."deletedAt" IS NULL
UNION ALL
  SELECT
    r."userId", 'registro', r."id",
    'registro', COALESCE(NULLIF(r."assunto", ''), r."nome"),
    r."empresaId",
    CASE WHEN r."unidadeId" IS NULL THEN ARRAY[]::text[] ELSE ARRAY[r."unidadeId"] END,
    r."prazo", NULL::text, NULL::text,
    'registro', r."id", NULL
  FROM "Registro" r
  WHERE r."prazo" IS NOT NULL AND r."deletedAt" IS NULL;
