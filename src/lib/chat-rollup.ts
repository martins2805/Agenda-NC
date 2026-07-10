import { prisma } from "@/lib/prisma";
import { generateChatReply } from "@/lib/gemini";
import { syncKnowledgeChunk } from "@/lib/knowledge-sync";
import type { ChatMessage } from "@/generated/prisma/client";

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SUMMARY_INSTRUCTION =
  "Resuma a conversa abaixo em um parágrafo curto e objetivo, em português, " +
  "destacando decisões, informações e pendências relevantes que valham a pena " +
  "lembrar depois. Responda apenas com o resumo, sem introduções nem saudações.";

export async function rollupPastDays(): Promise<void> {
  const todayStart = new Date(`${dateKey(new Date())}T00:00:00.000Z`);

  const oldMessages = await prisma.chatMessage.findMany({
    where: { createdAt: { lt: todayStart } },
    orderBy: { createdAt: "asc" },
  });

  if (oldMessages.length === 0) return;

  const byDay = new Map<string, ChatMessage[]>();
  for (const message of oldMessages) {
    const key = dateKey(message.createdAt);
    const bucket = byDay.get(key) ?? [];
    bucket.push(message);
    byDay.set(key, bucket);
  }

  for (const [day, messages] of byDay) {
    try {
      const transcript = messages
        .map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
        .join("\n");

      const summary = await generateChatReply(SUMMARY_INSTRUCTION, [
        { role: "user", text: transcript },
      ]);

      await syncKnowledgeChunk(
        "chat_summary",
        day,
        `Resumo da conversa de ${day}:\n${summary}`
      );

      await prisma.chatMessage.deleteMany({
        where: { id: { in: messages.map((m) => m.id) } },
      });
    } catch (error) {
      console.error(`Falha ao resumir conversas do dia ${day}`, error);
    }
  }
}
