import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateChatReply, type ChatTurn } from "@/lib/gemini";
import { retrieveContext } from "@/lib/rag";
import { rollupPastDays } from "@/lib/chat-rollup";

function todayStart(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

const SYSTEM_PREAMBLE =
  "Você é o assistente do Agenda NC, um sistema de controle de atividades, " +
  "registros de reunião e planilhas. Responda de forma direta, objetiva e em " +
  "português. Baseie-se nas informações de contexto abaixo (dados reais do " +
  "usuário) para responder perguntas sobre atividades, registros, planilhas " +
  "ou conversas anteriores. Se a resposta não estiver no contexto, diga " +
  "claramente que não encontrou essa informação, sem inventar.";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    where: { createdAt: { gte: todayStart() } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.chatMessage.deleteMany({ where: { createdAt: { gte: todayStart() } } });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = (await request.json()) as { message?: string };
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
  }

  await rollupPastDays().catch((error) =>
    console.error("Falha no rollup diário do chat", error)
  );

  await prisma.chatMessage.create({
    data: { role: "user", content: message },
  });

  const [contextChunks, todaysMessages] = await Promise.all([
    retrieveContext(message),
    prisma.chatMessage.findMany({
      where: { createdAt: { gte: todayStart() } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const contextText = contextChunks.length
    ? contextChunks
        .map((c, i) => `(${i + 1}) [${c.sourceType}]\n${c.content}`)
        .join("\n\n")
    : "Nenhum dado relevante encontrado na base.";

  const systemInstruction = `${SYSTEM_PREAMBLE}\n\nContexto relevante:\n${contextText}`;

  const history: ChatTurn[] = todaysMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    text: m.content,
  }));

  const reply = await generateChatReply(systemInstruction, history);

  await prisma.chatMessage.create({
    data: { role: "assistant", content: reply },
  });

  return NextResponse.json({ reply });
}
