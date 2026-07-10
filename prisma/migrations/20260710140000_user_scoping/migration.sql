-- DropIndex
DROP INDEX "LookupItem_kind_idx";

-- DropIndex
DROP INDEX "KnowledgeChunk_sourceType_idx";

-- DropIndex
DROP INDEX "KnowledgeChunk_sourceType_sourceId_key";

-- DropIndex
DROP INDEX "ChatMessage_createdAt_idx";

-- AlterTable (add as nullable first so existing rows can be backfilled)
ALTER TABLE "LookupItem" ADD COLUMN     "userId" TEXT;
ALTER TABLE "Atividade" ADD COLUMN     "userId" TEXT;
ALTER TABLE "Registro" ADD COLUMN     "userId" TEXT;
ALTER TABLE "Planilha" ADD COLUMN     "userId" TEXT;
ALTER TABLE "KnowledgeChunk" ADD COLUMN     "userId" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN     "userId" TEXT;

-- Backfill: assign all pre-existing rows to the oldest user account.
UPDATE "LookupItem" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1) WHERE "userId" IS NULL;
UPDATE "Atividade" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1) WHERE "userId" IS NULL;
UPDATE "Registro" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1) WHERE "userId" IS NULL;
UPDATE "Planilha" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1) WHERE "userId" IS NULL;
UPDATE "KnowledgeChunk" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1) WHERE "userId" IS NULL;
UPDATE "ChatMessage" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1) WHERE "userId" IS NULL;

-- Now that every row has a userId, enforce NOT NULL.
ALTER TABLE "LookupItem" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Atividade" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Registro" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Planilha" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "KnowledgeChunk" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "ChatMessage" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "LookupItem_userId_kind_idx" ON "LookupItem"("userId", "kind");

-- CreateIndex
CREATE INDEX "Atividade_userId_idx" ON "Atividade"("userId");

-- CreateIndex
CREATE INDEX "Registro_userId_idx" ON "Registro"("userId");

-- CreateIndex
CREATE INDEX "Planilha_userId_idx" ON "Planilha"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_userId_sourceType_idx" ON "KnowledgeChunk"("userId", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeChunk_userId_sourceType_sourceId_key" ON "KnowledgeChunk"("userId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "LookupItem" ADD CONSTRAINT "LookupItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planilha" ADD CONSTRAINT "Planilha_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
