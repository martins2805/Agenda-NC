-- PROMPT 3 (3.3): configuracao de exibicao de Lista e Cards — quais campos
-- aparecem e em que ordem. Reaproveita a tabela ConfiguracaoVisual (chaves
-- namespaced por "lista:" / "card:"), que so precisava de uma coluna de ordem.
--
-- So ADICAO de coluna, com default — nenhuma linha existente muda de
-- comportamento. Idempotente (licao da S1).

ALTER TABLE "ConfiguracaoVisual" ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 0;
