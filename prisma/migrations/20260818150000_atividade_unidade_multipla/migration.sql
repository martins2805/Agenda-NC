-- Backlog "PROMPT 2 / Adaptações Matheus" (docs/PLANO-DE-SPRINTS.md, secao 7):
-- vincular a mesma Atividade a mais de uma Unidade. Empresa continua unica
-- (unidade e filha de empresa, spec 05-atividades.md); o multi-valor se
-- aplica so a Unidade, em Atividade e AtividadeGeral (D19, docs/DECISOES.md).
--
-- unidadeId (escalar) vira unidadeIds (text[]), mesmo padrao ja usado para
-- tipoAtividadeIds. Backfill preserva o valor existente como unico elemento
-- do array antes de derrubar a coluna antiga.
--
-- A view prazo_unificado depende de "unidadeId" (Atividade/AtividadeGeral),
-- entao precisa ser derrubada antes do ALTER TABLE e recriada depois — troca
-- de TIPO de uma coluna do meio da lista nao e permitida via CREATE OR
-- REPLACE VIEW (so apendice ao final, licao da S1/S7 registrada em
-- 20260723120000_prazo_unificado_origem_tipo). ChecklistGeralItem.unidadeId
-- e Registro.unidadeId ficam escalares (fora de escopo) — a view normaliza
-- os dois para array de 0 ou 1 elemento so para bater o tipo da coluna
-- combinada do UNION ALL.
--
-- IDEMPOTENTE (licao da S1): seguro rodar de novo em cima de um estado
-- parcialmente aplicado — cada ALTER usa IF EXISTS/IF NOT EXISTS e o backfill
-- so mexe em linhas ainda nao migradas (unidadeIds vazio).

DROP VIEW IF EXISTS prazo_unificado;

-- Atividade

ALTER TABLE "Atividade" ADD COLUMN IF NOT EXISTS "unidadeIds" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "Atividade"
SET "unidadeIds" = ARRAY["unidadeId"]
WHERE "unidadeId" IS NOT NULL AND cardinality("unidadeIds") = 0;

ALTER TABLE "Atividade" DROP COLUMN IF EXISTS "unidadeId";

DROP INDEX IF EXISTS "Atividade_userId_unidadeId_idx";

-- AtividadeGeral

ALTER TABLE "AtividadeGeral" ADD COLUMN IF NOT EXISTS "unidadeIds" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "AtividadeGeral"
SET "unidadeIds" = ARRAY["unidadeId"]
WHERE "unidadeId" IS NOT NULL AND cardinality("unidadeIds") = 0;

ALTER TABLE "AtividadeGeral" DROP COLUMN IF EXISTS "unidadeId";

-- Recria a view (mesma ordem de colunas de 20260723140000_registro_prazo;
-- só o TIPO de unidade_id muda, de text para text[]).

CREATE OR REPLACE VIEW prazo_unificado AS
  SELECT
    a."userId" AS user_id, 'atividade' AS objeto_tipo, a."id" AS objeto_id,
    'atividade' AS origem_tipo, a."assunto" AS titulo, a."empresaId" AS empresa_id,
    a."unidadeIds" AS unidade_id, a."prazo" AS data, a."prioridade"::text AS prioridade,
    a."status"::text AS status, 'atividade' AS tipo_prazo,
    a."id" AS origem_id, a."tipoAtividadeIds" AS tipo_atividade_ids
  FROM "Atividade" a
  WHERE a."prazo" IS NOT NULL AND a."deletedAt" IS NULL
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
