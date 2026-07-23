-- Sprint 7: Calendário. A view prazo_unificado (S1) precisa de mais duas colunas
-- para servir de fonte única de verdade para o calendário:
--
-- - origem_id: id da linha REAL de origem do prazo. Até aqui a view só expunha
--   objeto_id (sempre o id da Atividade/AtividadeGeral pai), o que impedia
--   distinguir QUAL item de checklist/proposta um prazo pertence quando há mais
--   de um na mesma atividade — sem isso não dá para editar o prazo certo direto
--   do painel do calendário.
-- - tipo_atividade_ids: replicado de Atividade.tipoAtividadeIds (NULL para
--   linhas originadas de AtividadeGeral) — permite o filtro "Tipo" do calendário.
--
-- CORREÇÃO (produção quebrou com esta migration): as duas colunas novas foram
-- originalmente inseridas NO MEIO da lista (origem_id logo após origem_tipo),
-- o que reordena todas as colunas seguintes. Postgres proíbe isso em
-- CREATE OR REPLACE VIEW — só aceita colunas novas ao FINAL da lista, nunca
-- inseridas/removidas/reordenadas no meio. Corrigido: as duas colunas novas
-- vão ao final, depois de tipo_prazo. As 11 colunas originais mantêm a mesma
-- ordem de sempre — SELECT * em consumidores existentes continua funcionando.
-- Idempotente (lição da S1): seguro rodar de novo.

CREATE OR REPLACE VIEW prazo_unificado AS
  SELECT
    a."userId" AS user_id, 'atividade' AS objeto_tipo, a."id" AS objeto_id,
    'atividade' AS origem_tipo, a."assunto" AS titulo, a."empresaId" AS empresa_id,
    a."unidadeId" AS unidade_id, a."prazo" AS data, a."prioridade"::text AS prioridade,
    a."status"::text AS status, 'atividade' AS tipo_prazo,
    a."id" AS origem_id, a."tipoAtividadeIds" AS tipo_atividade_ids
  FROM "Atividade" a
  WHERE a."prazo" IS NOT NULL AND a."deletedAt" IS NULL
UNION ALL
  SELECT
    a."userId", 'atividade', a."id",
    'checklist', c."texto", a."empresaId", a."unidadeId",
    c."prazo", a."prioridade"::text,
    CASE WHEN c."concluido" THEN 'Concluido' ELSE 'Pendente' END,
    'checklist', c."id", a."tipoAtividadeIds"
  FROM "ChecklistItem" c
  JOIN "Atividade" a ON a."id" = c."atividadeId"
  WHERE c."prazo" IS NOT NULL AND a."deletedAt" IS NULL
UNION ALL
  SELECT
    g."userId", 'atividadeGeral', g."id",
    'atividadeGeral', g."assunto", g."empresaId", g."unidadeId",
    g."prazo", g."prioridade"::text, g."status",
    'atividade', g."id", NULL
  FROM "AtividadeGeral" g
  WHERE g."prazo" IS NOT NULL
UNION ALL
  SELECT
    g."userId", 'atividadeGeral', g."id",
    'checklist', ci."texto", ci."empresaId", ci."unidadeId",
    ci."prazo", ci."prioridade"::text, ci."status"::text,
    'checklist', ci."id", NULL
  FROM "ChecklistGeralItem" ci
  JOIN "AtividadeGeral" g ON g."id" = ci."atividadeGeralId"
  WHERE ci."prazo" IS NOT NULL
UNION ALL
  SELECT
    a."userId", 'atividade', a."id",
    'proposta', a."assunto", a."empresaId", a."unidadeId",
    p."prazoFim", a."prioridade"::text, a."status"::text,
    'proposta', p."id", a."tipoAtividadeIds"
  FROM "Proposta" p
  JOIN "Atividade" a ON a."id" = p."atividadeId"
  WHERE p."prazoFim" IS NOT NULL AND a."deletedAt" IS NULL;
