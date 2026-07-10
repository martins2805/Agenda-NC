-- AlterTable
ALTER TABLE "Atividade" ADD COLUMN     "alinhamentos" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN     "prazo" TIMESTAMP(3);
