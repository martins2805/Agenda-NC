import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateChatReply, type ChatTurn } from "@/lib/gemini";
import { retrieveContext } from "@/lib/rag";
import { rollupPastDays } from "@/lib/chat-rollup";
import { buildEntityIndex } from "@/lib/chat-index";
import { TOOL_DECLARATIONS, executeTool } from "@/lib/chat-tools";

function todayStart(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

const SYSTEM_PREAMBLE =
  "Você é o assistente do Agenda NC, um sistema de controle de atividades, " +
  "registros de reunião e planilhas. Responda de forma direta, objetiva e em " +
  "português.\n\n" +
  "Você tem ferramentas para CRIAR, ATUALIZAR e EXCLUIR atividades, registros " +
  "e planilhas de verdade no banco de dados. Use-as sempre que o usuário pedir " +
  "para registrar, criar, editar, atualizar ou apagar algo — não finja que fez, " +
  "chame a ferramenta correspondente. Para localizar o id de algo a editar ou " +
  "excluir, use o índice de entidades abaixo.\n\n" +
  "Exclusão é irreversível: ao chamar excluir_atividade/excluir_registro/" +
  "excluir_planilha, informe confirmado=true SOMENTE depois que o usuário " +
  "confirmar explicitamente, em uma mensagem própria, que quer excluir aquele " +
  "item específico. Se o usuário só pediu para excluir mas ainda não confirmou, " +
  "pergunte antes de chamar a ferramenta com confirmado=true.\n\n" +
  "Para perguntas sobre os dados (não sobre criar/editar/excluir), baseie-se " +
  "no contexto relevante abaixo. Se a resposta não estiver no contexto nem no " +
  "índice, diga claramente que não encontrou, sem inventar.";

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

  const [contextChunks, entityIndex, todaysMessages] = await Promise.all([
    retrieveContext(message),
    buildEntityIndex(),
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

  const systemInstruction =
    `${SYSTEM_PREAMBLE}\n\n` +
    `Índice de entidades (use os ids exatamente como estão):\n${entityIndex}\n\n` +
    `Contexto relevante para a pergunta atual:\n${contextText}`;

  const history: ChatTurn[] = todaysMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    text: m.content,
  }));

  const reply = await generateChatReply(systemInstruction, history, {
    tools: TOOL_DECLARATIONS,
    execute: executeTool,
  });

  await prisma.chatMessage.create({
    data: { role: "assistant", content: reply },
  });

  return NextResponse.json({ reply });
}
