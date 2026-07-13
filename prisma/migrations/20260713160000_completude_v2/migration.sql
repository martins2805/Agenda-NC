-- Soft delete (lixeira) for Atividade/Registro/Planilha
ALTER TABLE "Atividade" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Registro" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Planilha" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Atividade_deletedAt_idx" ON "Atividade"("deletedAt");
CREATE INDEX "Registro_deletedAt_idx" ON "Registro"("deletedAt");
CREATE INDEX "Planilha_deletedAt_idx" ON "Planilha"("deletedAt");

-- Proposta refinements: tipo (MRR/PS), detalhe livre, observacao, prazo
-- (data unica ou periodo) e status de negociacao
ALTER TABLE "Proposta" ADD COLUMN "tipo" TEXT;
ALTER TABLE "Proposta" ADD COLUMN "detalhe" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Proposta" ADD COLUMN "observacao" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Proposta" ADD COLUMN "prazoInicio" TIMESTAMP(3);
ALTER TABLE "Proposta" ADD COLUMN "prazoFim" TIMESTAMP(3);
ALTER TABLE "Proposta" ADD COLUMN "statusNegociacao" TEXT;

-- ChecklistItem subitens (self-relation)
ALTER TABLE "ChecklistItem" ADD COLUMN "parentId" TEXT;
CREATE INDEX "ChecklistItem_parentId_idx" ON "ChecklistItem"("parentId");
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reusable checklist templates
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChecklistTemplate_userId_idx" ON "ChecklistTemplate"("userId");
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChecklistTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,

    CONSTRAINT "ChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChecklistTemplateItem_templateId_idx" ON "ChecklistTemplateItem"("templateId");
CREATE INDEX "ChecklistTemplateItem_parentId_idx" ON "ChecklistTemplateItem"("parentId");
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "ChecklistTemplateItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
