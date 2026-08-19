-- PROMPT 3 (3.1/3.2/6): configuracao visual centralizada dos elementos
-- semanticos (status, prioridade, prazo, negociacao), por usuario.
--
-- So ADICAO de tabela — nenhuma tabela, coluna ou view existente e tocada.
-- Idempotente (licao da S1), mesmo padrao de 20260723130000_widget_preferencia.

CREATE TABLE IF NOT EXISTS "ConfiguracaoVisual" (
  "id"      TEXT NOT NULL,
  "userId"  TEXT NOT NULL,
  "chave"   TEXT NOT NULL,
  "cor"     TEXT,
  "tamanho" TEXT,
  "visivel" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ConfiguracaoVisual_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConfiguracaoVisual_userId_chave_key" ON "ConfiguracaoVisual"("userId", "chave");
CREATE INDEX IF NOT EXISTS "ConfiguracaoVisual_userId_idx" ON "ConfiguracaoVisual"("userId");

DO $$ BEGIN
  ALTER TABLE "ConfiguracaoVisual"
  ADD CONSTRAINT "ConfiguracaoVisual_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
