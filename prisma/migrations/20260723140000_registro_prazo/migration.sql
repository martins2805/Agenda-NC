-- Sprint 11: Registros ganha prazo opcional (spec pede "prazo opcional" e
-- "aparição no calendário") e prazo_unificado passa a incluir Registro.
--
-- Registro não tem conceito de prioridade/status de negócio (diferente de
-- Atividade/AtividadeGeral) — em vez de inventar um valor falso só para
-- preencher a coluna, prioridade/status ficam NULL para essas linhas; a UI do
-- calendário (S7) foi ajustada para tratar prioridade ausente sem quebrar.
--
-- Só ADIÇÃO (coluna nova + CREATE OR REPLACE VIEW) — nenhuma coluna/linha
-- existente muda. Idempotente (lição da S1).

ALTER TABLE "Registro" ADD COLUMN IF NOT EXISTS "prazo" TIMESTAMP(3);

CREATE OR REPLACE VIEW prazo_unificado AS
  SELECT
    a."userId" AS user_id, 'atividade' AS objeto_tipo, a."id" AS objeto_id,
    'atividade' AS origem_tipo, a."id" AS origem_id, a."assunto" AS titulo,
    a."empresaId" AS empresa_id, a."unidadeId" AS unidade_id, a."prazo" AS data,
    a."prioridade"::text AS prioridade, a."status"::text AS status,
    'atividade' AS tipo_prazo, a."tipoAtividadeIds" AS tipo_atividade_ids
  FROM "Atividade" a
  WHERE a."prazo" IS NOT NULL AND a."deletedAt" IS NULL
UNION ALL
  SELECT
    a."userId", 'atividade', a."id",
    'checklist', c."id", c."texto", a."empresaId", a."unidadeId",
    c."prazo", a."prioridade"::text,
    CASE WHEN c."concluido" THEN 'Concluido' ELSE 'Pendente' END,
    'checklist', a."tipoAtividadeIds"
  FROM "ChecklistItem" c
  JOIN "Atividade" a ON a."id" = c."atividadeId"
  WHERE c."prazo" IS NOT NULL AND a."deletedAt" IS NULL
UNION ALL
  SELECT
    g."userId", 'atividadeGeral', g."id",
    'atividadeGeral', g."id", g."assunto", g."empresaId", g."unidadeId",
    g."prazo", g."prioridade"::text, g."status",
    'atividade', NULL
  FROM "AtividadeGeral" g
  WHERE g."prazo" IS NOT NULL
UNION ALL
  SELECT
    g."userId", 'atividadeGeral', g."id",
    'checklist', ci."id", ci."texto", ci."empresaId", ci."unidadeId",
    ci."prazo", ci."prioridade"::text, ci."status"::text,
    'checklist', NULL
  FROM "ChecklistGeralItem" ci
  JOIN "AtividadeGeral" g ON g."id" = ci."atividadeGeralId"
  WHERE ci."prazo" IS NOT NULL
UNION ALL
  SELECT
    a."userId", 'atividade', a."id",
    'proposta', p."id", a."assunto", a."empresaId", a."unidadeId",
    p."prazoFim", a."prioridade"::text, a."status"::text,
    'proposta', a."tipoAtividadeIds"
  FROM "Proposta" p
  JOIN "Atividade" a ON a."id" = p."atividadeId"
  WHERE p."prazoFim" IS NOT NULL AND a."deletedAt" IS NULL
UNION ALL
  SELECT
    r."userId", 'registro', r."id",
    'registro', r."id", COALESCE(NULLIF(r."assunto", ''), r."nome"),
    r."empresaId", r."unidadeId", r."prazo",
    NULL::text, NULL::text,
    'registro', NULL
  FROM "Registro" r
  WHERE r."prazo" IS NOT NULL AND r."deletedAt" IS NULL;
