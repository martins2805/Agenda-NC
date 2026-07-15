ALTER TABLE "AtividadeGeral" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "AtividadeGeral" ADD COLUMN "unidadeId" TEXT;

ALTER TABLE "ChecklistGeralItem" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "ChecklistGeralItem" ADD COLUMN "unidadeId" TEXT;

-- "status geral" agora tem apenas 3 opções (Pendente/Em andamento/Concluído),
-- desacopladas do enum StatusConclusao de 4 opções usado em Atividade.
ALTER TABLE "AtividadeGeral" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AtividadeGeral" ALTER COLUMN "status" TYPE TEXT USING (
  CASE "status"::text
    WHEN 'Concluido' THEN 'Concluído'
    WHEN 'AguardandoRetornoInterno' THEN 'Em andamento'
    WHEN 'AguardandoRetornoCliente' THEN 'Em andamento'
    ELSE 'Pendente'
  END
);
ALTER TABLE "AtividadeGeral" ALTER COLUMN "status" SET DEFAULT 'Pendente';
