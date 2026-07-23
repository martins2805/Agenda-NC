-- Sprint 3: LookupItem ganha cor (nome de token da paleta base, nunca hex
-- livre — Regra 02) e ordem (controle manual de ordenação em Configurações).
-- Idempotente por padrão (lição da S1): seguro rodar em cima de um estado
-- parcialmente aplicado.

ALTER TABLE "LookupItem" ADD COLUMN IF NOT EXISTS "cor" TEXT;
ALTER TABLE "LookupItem" ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 0;
