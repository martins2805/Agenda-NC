-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LookupKind" AS ENUM ('empresa', 'unidade', 'assunto', 'tipoAtividade', 'servicoProduto', 'escopo', 'amostragem', 'categoriaRegistro', 'categoriaPlanilha');

-- CreateEnum
CREATE TYPE "StatusConclusao" AS ENUM ('Pendente', 'AguardandoRetornoInterno', 'AguardandoRetornoCliente', 'Concluido');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('Urgente', 'Importante', 'Medio', 'Baixo');

-- CreateTable
CREATE TABLE "LookupItem" (
    "id" TEXT NOT NULL,
    "kind" "LookupKind" NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LookupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atividade" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "unidadeId" TEXT,
    "assuntoId" TEXT,
    "tipoAtividadeIds" TEXT[],
    "emailConteudo" TEXT NOT NULL DEFAULT '',
    "oportunidadeTexto" TEXT NOT NULL DEFAULT '',
    "contato" TEXT NOT NULL DEFAULT '',
    "prazo" TIMESTAMP(3),
    "descricao" TEXT NOT NULL DEFAULT '',
    "status" "StatusConclusao" NOT NULL DEFAULT 'Pendente',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'Medio',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposta" (
    "id" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "servicoProdutoIds" TEXT[],
    "escopoIds" TEXT[],
    "amostragemIds" TEXT[],
    "quantidade" DOUBLE PRECISION,
    "valorUnitario" DOUBLE PRECISION,
    "valorTotal" DOUBLE PRECISION,

    CONSTRAINT "Proposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registro" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "unidadeId" TEXT,
    "contato" TEXT NOT NULL DEFAULT '',
    "assuntoId" TEXT,
    "categoriaIds" TEXT[],
    "atividadeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroTab" (
    "id" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL DEFAULT '',
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RegistroTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planilha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT '',
    "empresaId" TEXT,
    "unidadeId" TEXT,
    "assuntoId" TEXT,
    "categoriaIds" TEXT[],
    "atividadeId" TEXT,
    "conteudo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planilha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LookupItem_kind_idx" ON "LookupItem"("kind");

-- CreateIndex
CREATE INDEX "Proposta_atividadeId_idx" ON "Proposta"("atividadeId");

-- CreateIndex
CREATE INDEX "ChecklistItem_atividadeId_idx" ON "ChecklistItem"("atividadeId");

-- CreateIndex
CREATE INDEX "RegistroTab_registroId_idx" ON "RegistroTab"("registroId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroTab" ADD CONSTRAINT "RegistroTab_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "Registro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
