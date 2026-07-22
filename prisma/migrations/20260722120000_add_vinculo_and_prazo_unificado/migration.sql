-- Sprint 1: vínculo polimórfico único, fonte única de prazos, índices e busca full-text.
-- Não destrutiva: nenhuma coluna é removida. Registro.atividadeId e Planilha.atividadeId
-- permanecem no schema como legado (ver comentário @deprecated em schema.prisma) até uma
-- sprint futura de limpeza confirmar que não sobrou leitura órfã.
--
-- IDEMPOTENTE: esta migration já falhou uma vez em produção no meio da aplicação
-- (bug de tipo na view, corrigido abaixo) e o Postgres não roda o script inteiro
-- numa única transação — tudo antes do ponto de falha ficou gravado. Cada bloco
-- abaixo é seguro de rodar de novo em cima de um estado parcialmente aplicado.

-- 1) Tabela Vinculo (substitui Registro.atividadeId / Planilha.atividadeId como fonte de verdade)

DO $$ BEGIN
  CREATE TYPE "VinculoTipo" AS ENUM ('atividade', 'atividadeGeral', 'registro', 'planilha');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Vinculo" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "origemTipo" "VinculoTipo" NOT NULL,
  "origemId" TEXT NOT NULL,
  "destinoTipo" "VinculoTipo" NOT NULL,
  "destinoId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vinculo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Vinculo_userId_origemTipo_origemId_destinoTipo_destinoId_key"
  ON "Vinculo"("userId", "origemTipo", "origemId", "destinoTipo", "destinoId");
CREATE INDEX IF NOT EXISTS "Vinculo_userId_origemTipo_origemId_idx" ON "Vinculo"("userId", "origemTipo", "origemId");
CREATE INDEX IF NOT EXISTS "Vinculo_userId_destinoTipo_destinoId_idx" ON "Vinculo"("userId", "destinoTipo", "destinoId");

DO $$ BEGIN
  ALTER TABLE "Vinculo"
  ADD CONSTRAINT "Vinculo_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Defesa em profundidade: mesmo se uma rota futura esquecer de normalizar o par
-- (src/lib/vinculos.ts::normalizarPar), a escrita falha em vez de duplicar A→B e B→A.
DO $$ BEGIN
  ALTER TABLE "Vinculo"
  ADD CONSTRAINT "vinculo_par_ordenado" CHECK (
    ("origemTipo"::text || ':' || "origemId") < ("destinoTipo"::text || ':' || "destinoId")
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Backfill idempotente dos vínculos hoje implícitos em atividadeId. Id determinístico
-- (md5 do par) + ON CONFLICT DO NOTHING: seguro de rodar quantas vezes for preciso.
-- 'atividade' < 'planilha' e 'atividade' < 'registro' alfabeticamente, então o par
-- normalizado sempre fica origem=atividade / destino=registro|planilha.

INSERT INTO "Vinculo" ("id", "userId", "origemTipo", "origemId", "destinoTipo", "destinoId", "createdAt")
SELECT
  md5(r."id" || ':registro:' || r."atividadeId"),
  r."userId",
  'atividade'::"VinculoTipo",
  r."atividadeId",
  'registro'::"VinculoTipo",
  r."id",
  now()
FROM "Registro" r
WHERE r."atividadeId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "Vinculo" ("id", "userId", "origemTipo", "origemId", "destinoTipo", "destinoId", "createdAt")
SELECT
  md5(p."id" || ':planilha:' || p."atividadeId"),
  p."userId",
  'atividade'::"VinculoTipo",
  p."atividadeId",
  'planilha'::"VinculoTipo",
  p."id",
  now()
FROM "Planilha" p
WHERE p."atividadeId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3) Índices novos para os filtros combinados (S1, critério de aceite de performance)

CREATE INDEX IF NOT EXISTS "Atividade_userId_empresaId_idx" ON "Atividade"("userId", "empresaId");
CREATE INDEX IF NOT EXISTS "Atividade_userId_unidadeId_idx" ON "Atividade"("userId", "unidadeId");
CREATE INDEX IF NOT EXISTS "Atividade_userId_status_idx" ON "Atividade"("userId", "status");
CREATE INDEX IF NOT EXISTS "Atividade_userId_prioridade_idx" ON "Atividade"("userId", "prioridade");
CREATE INDEX IF NOT EXISTS "Atividade_userId_prazo_idx" ON "Atividade"("userId", "prazo");

CREATE INDEX IF NOT EXISTS "AtividadeGeral_userId_empresaId_idx" ON "AtividadeGeral"("userId", "empresaId");
CREATE INDEX IF NOT EXISTS "AtividadeGeral_userId_status_idx" ON "AtividadeGeral"("userId", "status");
CREATE INDEX IF NOT EXISTS "AtividadeGeral_userId_prazo_idx" ON "AtividadeGeral"("userId", "prazo");

CREATE INDEX IF NOT EXISTS "Registro_userId_empresaId_idx" ON "Registro"("userId", "empresaId");
CREATE INDEX IF NOT EXISTS "Planilha_userId_empresaId_idx" ON "Planilha"("userId", "empresaId");

-- 4) Fonte única de prazos. Consumida via query direta / GET /api/prazos nesta sprint;
-- o rewire de Dashboard/Calendário para consumi-la é escopo de S7/S8 (ver plano de sprints).
-- CREATE OR REPLACE: era exatamente aqui que a migration falhava (bug de tipo, corrigido
-- abaixo — ci."status" é enum StatusConclusao na coluna real, faltava o cast ::text).

CREATE OR REPLACE VIEW prazo_unificado AS
  SELECT
    a."userId" AS user_id, 'atividade' AS objeto_tipo, a."id" AS objeto_id,
    'atividade' AS origem_tipo, a."assunto" AS titulo, a."empresaId" AS empresa_id,
    a."unidadeId" AS unidade_id, a."prazo" AS data, a."prioridade"::text AS prioridade,
    a."status"::text AS status, 'atividade' AS tipo_prazo
  FROM "Atividade" a
  WHERE a."prazo" IS NOT NULL AND a."deletedAt" IS NULL
UNION ALL
  SELECT
    a."userId", 'atividade', a."id",
    'checklist', c."texto", a."empresaId", a."unidadeId",
    c."prazo", a."prioridade"::text,
    CASE WHEN c."concluido" THEN 'Concluido' ELSE 'Pendente' END,
    'checklist'
  FROM "ChecklistItem" c
  JOIN "Atividade" a ON a."id" = c."atividadeId"
  WHERE c."prazo" IS NOT NULL AND a."deletedAt" IS NULL
UNION ALL
  SELECT
    g."userId", 'atividadeGeral', g."id",
    'atividadeGeral', g."assunto", g."empresaId", g."unidadeId",
    g."prazo", g."prioridade"::text, g."status",
    'atividade'
  FROM "AtividadeGeral" g
  WHERE g."prazo" IS NOT NULL
UNION ALL
  SELECT
    g."userId", 'atividadeGeral', g."id",
    'checklist', ci."texto", ci."empresaId", ci."unidadeId",
    ci."prazo", ci."prioridade"::text, ci."status"::text,
    'checklist'
  FROM "ChecklistGeralItem" ci
  JOIN "AtividadeGeral" g ON g."id" = ci."atividadeGeralId"
  WHERE ci."prazo" IS NOT NULL
UNION ALL
  SELECT
    a."userId", 'atividade', a."id",
    'proposta', a."assunto", a."empresaId", a."unidadeId",
    p."prazoFim", a."prioridade"::text, a."status"::text,
    'proposta'
  FROM "Proposta" p
  JOIN "Atividade" a ON a."id" = p."atividadeId"
  WHERE p."prazoFim" IS NOT NULL AND a."deletedAt" IS NULL;

-- 5) Busca full-text (tsvector/pg_trgm), pedida explicitamente pela spec da S1.
-- Não conectada a nenhuma tela nesta sprint (keyword search continua em memória
-- via .includes() nos consumidores atuais) — existe e é testável por query direta.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "Atividade" ADD COLUMN IF NOT EXISTS "busca" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce("assunto", '') || ' ' || coalesce("descricao", '') || ' ' ||
      coalesce("emailConteudo", '') || ' ' || coalesce("oportunidadeTexto", '') || ' ' ||
      coalesce("contato", '')
    )
  ) STORED;
CREATE INDEX IF NOT EXISTS "Atividade_busca_idx" ON "Atividade" USING GIN ("busca");
CREATE INDEX IF NOT EXISTS "Atividade_assunto_trgm_idx" ON "Atividade" USING GIN ("assunto" gin_trgm_ops);

ALTER TABLE "AtividadeGeral" ADD COLUMN IF NOT EXISTS "busca" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce("assunto", '') || ' ' || coalesce("descricao", '') || ' ' || coalesce("vinculos", '')
    )
  ) STORED;
CREATE INDEX IF NOT EXISTS "AtividadeGeral_busca_idx" ON "AtividadeGeral" USING GIN ("busca");
CREATE INDEX IF NOT EXISTS "AtividadeGeral_assunto_trgm_idx" ON "AtividadeGeral" USING GIN ("assunto" gin_trgm_ops);

ALTER TABLE "Registro" ADD COLUMN IF NOT EXISTS "busca" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce("nome", '') || ' ' || coalesce("assunto", ''))
  ) STORED;
CREATE INDEX IF NOT EXISTS "Registro_busca_idx" ON "Registro" USING GIN ("busca");
CREATE INDEX IF NOT EXISTS "Registro_nome_trgm_idx" ON "Registro" USING GIN ("nome" gin_trgm_ops);

ALTER TABLE "Planilha" ADD COLUMN IF NOT EXISTS "busca" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce("nome", '') || ' ' || coalesce("assunto", ''))
  ) STORED;
CREATE INDEX IF NOT EXISTS "Planilha_busca_idx" ON "Planilha" USING GIN ("busca");
CREATE INDEX IF NOT EXISTS "Planilha_nome_trgm_idx" ON "Planilha" USING GIN ("nome" gin_trgm_ops);
