-- Corrige a geracao do prazo recorrente (PROMPT 3, item 4.1).
--
-- A versao de 20260818170000 usava generate_series(timestamp, timestamp,
-- interval), que soma o intervalo sobre o RESULTADO ANTERIOR. Com "todo mes"
-- a partir do dia 31 isso produz 31/01, 28/02 e depois fica preso no dia 28
-- indefinidamente (28/03, 28/04...) — verificado por consulta ao banco.
-- Passa a somar N periodos a data ORIGINAL, entao fevereiro encurta uma vez
-- so: 31/01, 28/02, 31/03, 30/04.
--
-- Nenhuma coluna muda; so o conjunto de linhas do bloco recorrente. Ainda
-- assim usa DROP + CREATE, pelo mesmo motivo da migration anterior.
-- IDEMPOTENTE: recriar a view e seguro rodar de novo.

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
  -- Prazo recorrente: uma linha por ocorrencia.
  -- Cada ocorrencia e a data inicial + N periodos, NAO a anterior + 1 periodo.
  -- A diferenca importa: generate_series(timestamp, ..., '1 month') soma sobre
  -- o resultado anterior, entao "todo dia 31" vira 31/01, 28/02 e a partir dai
  -- fica preso no dia 28 para sempre. Somando N periodos a data original, o
  -- mes de fevereiro e apenas encurtado uma vez (31/01, 28/02, 31/03, 30/04).
  -- Horizonte maximo de 2 anos quando nao ha data de termino, para a view nao
  -- virar infinita. origem_id carrega a data, para cada ocorrencia ter chave.
  SELECT
    a."userId", 'atividade', a."id",
    'atividade', a."assunto", a."empresaId", a."unidadeIds",
    occ.data, a."prioridade"::text, a."status"::text,
    'recorrente', a."id" || '#' || to_char(occ.data, 'YYYYMMDDHH24MI'), a."tipoAtividadeIds"
  FROM "Atividade" a
  CROSS JOIN LATERAL (
    SELECT a."prazo" + (n * (GREATEST(COALESCE(a."recorrenciaCada", 1), 1)::text || ' ' ||
      CASE a."recorrenciaFreq"
        WHEN 'Diaria'  THEN 'days'
        WHEN 'Semanal' THEN 'weeks'
        WHEN 'Mensal'  THEN 'months'
        ELSE 'years'
      END)::interval) AS data
    FROM generate_series(0,
      CASE a."recorrenciaFreq"
        WHEN 'Diaria'  THEN 730
        WHEN 'Semanal' THEN 104
        WHEN 'Mensal'  THEN 24
        ELSE 2
      END / GREATEST(COALESCE(a."recorrenciaCada", 1), 1)
    ) AS n
  ) occ
  WHERE a."prazo" IS NOT NULL AND a."deletedAt" IS NULL
    AND a."modalidadePrazo" = 'Recorrente'
    AND a."recorrenciaFreq" IS NOT NULL
    AND occ.data <= COALESCE(a."recorrenciaAte", a."prazo" + INTERVAL '2 years')
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
