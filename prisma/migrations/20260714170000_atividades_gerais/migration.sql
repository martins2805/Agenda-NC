ALTER TYPE "LookupKind" ADD VALUE 'tipoAtividadeGeral';
ALTER TYPE "LookupKind" ADD VALUE 'setorInterno';

CREATE TABLE "AtividadeGeral" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tipoIds" TEXT[],
  "assunto" TEXT NOT NULL DEFAULT '',
  "vinculos" TEXT NOT NULL DEFAULT '',
  "prazo" TIMESTAMP(3),
  "descricao" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'Pendente',
  "prioridade" "Prioridade" NOT NULL DEFAULT 'Medio',
  "setorIds" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AtividadeGeral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChecklistGeralItem" (
  "id" TEXT NOT NULL,
  "atividadeGeralId" TEXT NOT NULL,
  "parentId" TEXT,
  "texto" TEXT NOT NULL,
  "status" "StatusConclusao" NOT NULL DEFAULT 'Pendente',
  "prioridade" "Prioridade" NOT NULL DEFAULT 'Medio',
  "prazo" TIMESTAMP(3),
  "ordem" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ChecklistGeralItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AtividadeGeral_userId_idx" ON "AtividadeGeral"("userId");
CREATE INDEX "ChecklistGeralItem_atividadeGeralId_idx" ON "ChecklistGeralItem"("atividadeGeralId");

ALTER TABLE "AtividadeGeral"
ADD CONSTRAINT "AtividadeGeral_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChecklistGeralItem"
ADD CONSTRAINT "ChecklistGeralItem_atividadeGeralId_fkey"
FOREIGN KEY ("atividadeGeralId") REFERENCES "AtividadeGeral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
