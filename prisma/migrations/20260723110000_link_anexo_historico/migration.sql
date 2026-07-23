-- Sprint 6: Atividades - detalhe, vínculos e histórico.
-- Só aditiva (CREATE TABLE), nenhuma coluna existente é alterada ou removida.
-- Idempotente desde o início (lição da S1/S3): seguro rodar em cima de um
-- estado parcialmente aplicado.

CREATE TABLE IF NOT EXISTS "Link" (
  "id"          TEXT NOT NULL,
  "atividadeId" TEXT NOT NULL,
  "titulo"      TEXT NOT NULL DEFAULT '',
  "url"         TEXT NOT NULL,
  "ordem"       INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Link_atividadeId_idx" ON "Link"("atividadeId");

DO $$ BEGIN
  ALTER TABLE "Link"
  ADD CONSTRAINT "Link_atividadeId_fkey"
  FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Anexo" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "atividadeId"    TEXT NOT NULL,
  "nomeOriginal"   TEXT NOT NULL,
  "nomeArmazenado" TEXT NOT NULL,
  "mimeType"       TEXT NOT NULL,
  "tamanho"        INTEGER NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Anexo_nomeArmazenado_key" ON "Anexo"("nomeArmazenado");
CREATE INDEX IF NOT EXISTS "Anexo_atividadeId_idx" ON "Anexo"("atividadeId");

DO $$ BEGIN
  ALTER TABLE "Anexo"
  ADD CONSTRAINT "Anexo_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Anexo"
  ADD CONSTRAINT "Anexo_atividadeId_fkey"
  FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Historico" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "atividadeId"   TEXT NOT NULL,
  "campo"         TEXT NOT NULL,
  "valorAnterior" TEXT,
  "valorNovo"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Historico_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Historico_atividadeId_createdAt_idx" ON "Historico"("atividadeId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "Historico"
  ADD CONSTRAINT "Historico_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Historico"
  ADD CONSTRAINT "Historico_atividadeId_fkey"
  FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
