import type { ChatTurn, ToolRunner } from "@/lib/gemini";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

function apiKey(): string {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("NVIDIA_API_KEY não configurada");
  return key;
}

interface OpenAiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
}

interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: object;
}

function toOpenAiTools(tools: object[] | undefined) {
  if (!tools || tools.length === 0) return undefined;
  const declarations = (
    tools[0] as { functionDeclarations?: GeminiFunctionDeclaration[] }
  ).functionDeclarations;
  if (!declarations) return undefined;

  return declarations.map((fd) => ({
    type: "function" as const,
    function: {
      name: fd.name,
      description: fd.description,
      parameters: fd.parameters,
    },
  }));
}

async function callModel(model: string, messages: OpenAiMessage[], tools?: ReturnType<typeof toOpenAiTools>) {
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(tools ? { tools, tool_choice: "auto" } : {}),
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`NVIDIA (${model}) falhou: ${res.status} ${body}`);
  }
  return JSON.parse(body);
}

// Runs one model of the provider fallback sequence to completion, including
// its own tool-calling round trips. A failure here (network error, bad
// response) is caught by the caller in gemini.ts, which moves on to the next
// model/provider in the sequence.
export async function attemptNvidiaModel(
  model: string,
  systemInstruction: string,
  history: ChatTurn[],
  toolRunner?: ToolRunner
): Promise<string> {
  const messages: OpenAiMessage[] = [
    { role: "system", content: systemInstruction },
    ...history.map((turn) => ({
      role: (turn.role === "model" ? "assistant" : "user") as "assistant" | "user",
      content: turn.text,
    })),
  ];

  const tools = toOpenAiTools(toolRunner?.tools);

  for (let round = 0; round < 5; round++) {
    const data = await callModel(model, messages, tools);
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error(`Resposta inesperada da NVIDIA (${model})`);

    const toolCalls: OpenAiToolCall[] | undefined = message.tool_calls;

    if (!toolCalls || toolCalls.length === 0 || !toolRunner) {
      const text = message.content ?? "";
      if (!text.trim()) throw new Error(`Resposta vazia da NVIDIA (${model})`);
      return text;
    }

    messages.push({ role: "assistant", content: message.content ?? null, tool_calls: toolCalls });

    for (const call of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      const result = await toolRunner.execute(call.function.name, args);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error(`Limite de chamadas de ferramenta excedido (NVIDIA ${model})`);
}
