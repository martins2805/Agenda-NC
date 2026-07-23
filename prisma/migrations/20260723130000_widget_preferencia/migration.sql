-- Sprint 8: preferência de widget do Dashboard (ordem, visibilidade, tamanho),
-- por usuário. Só ADIÇÃO de tabela, idempotente (lição da S1).

CREATE TABLE IF NOT EXISTS "WidgetPreferencia" (
  "id"       TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  "widgetId" TEXT NOT NULL,
  "ordem"    INTEGER NOT NULL DEFAULT 0,
  "visivel"  BOOLEAN NOT NULL DEFAULT true,
  "tamanho"  TEXT NOT NULL DEFAULT 'normal',
  CONSTRAINT "WidgetPreferencia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WidgetPreferencia_userId_widgetId_key" ON "WidgetPreferencia"("userId", "widgetId");
CREATE INDEX IF NOT EXISTS "WidgetPreferencia_userId_idx" ON "WidgetPreferencia"("userId");

DO $$ BEGIN
  ALTER TABLE "WidgetPreferencia"
  ADD CONSTRAINT "WidgetPreferencia_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
