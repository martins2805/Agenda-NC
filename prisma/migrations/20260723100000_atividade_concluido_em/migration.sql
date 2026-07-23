-- Sprint 4: data de conclusão automática (escopo S4 / D13). Setada pelo
-- servidor quando o status entra em "Concluido", limpa quando sai. Idempotente.

ALTER TABLE "Atividade" ADD COLUMN IF NOT EXISTS "concluidoEm" TIMESTAMP(3);
