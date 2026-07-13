-- AlterTable: Registro gains a free-text "nome" field, mirroring Planilha.nome
ALTER TABLE "Registro" ADD COLUMN "nome" TEXT NOT NULL DEFAULT '';
