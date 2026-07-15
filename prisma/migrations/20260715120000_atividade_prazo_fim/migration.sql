-- Agendamento: prazo final opcional para atividades do tipo "Agendamento".
ALTER TABLE "Atividade" ADD COLUMN "prazoFim" TIMESTAMP(3);
