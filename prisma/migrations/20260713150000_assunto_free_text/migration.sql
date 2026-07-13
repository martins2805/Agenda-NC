-- Assunto stops being a managed lookup and becomes free text on each entity.

-- AlterTable: Atividade
ALTER TABLE "Atividade" ADD COLUMN "assunto" TEXT NOT NULL DEFAULT '';
UPDATE "Atividade" a
SET "assunto" = COALESCE((SELECT li.name FROM "LookupItem" li WHERE li.id = a."assuntoId"), '');
ALTER TABLE "Atividade" DROP COLUMN "assuntoId";

-- AlterTable: Registro
ALTER TABLE "Registro" ADD COLUMN "assunto" TEXT NOT NULL DEFAULT '';
UPDATE "Registro" r
SET "assunto" = COALESCE((SELECT li.name FROM "LookupItem" li WHERE li.id = r."assuntoId"), '');
ALTER TABLE "Registro" DROP COLUMN "assuntoId";

-- AlterTable: Planilha
ALTER TABLE "Planilha" ADD COLUMN "assunto" TEXT NOT NULL DEFAULT '';
UPDATE "Planilha" p
SET "assunto" = COALESCE((SELECT li.name FROM "LookupItem" li WHERE li.id = p."assuntoId"), '');
ALTER TABLE "Planilha" DROP COLUMN "assuntoId";

-- Drop now-orphaned "assunto" lookup items
DELETE FROM "LookupItem" WHERE "kind" = 'assunto';

-- Remove "assunto" from the LookupKind enum (Postgres requires recreating the type)
CREATE TYPE "LookupKind_new" AS ENUM ('empresa', 'unidade', 'tipoAtividade', 'servicoProduto', 'escopo', 'amostragem', 'categoriaRegistro', 'categoriaPlanilha');
ALTER TABLE "LookupItem" ALTER COLUMN "kind" TYPE "LookupKind_new" USING ("kind"::text::"LookupKind_new");
DROP TYPE "LookupKind";
ALTER TYPE "LookupKind_new" RENAME TO "LookupKind";
