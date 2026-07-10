const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const CHAT_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
];
const EMBEDDING_MODEL = "gemini-embedding-001";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurada");
  return key;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `${GEMINI_BASE_URL}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, 8000) }] },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini embed falhou: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: object };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

async function callModel(
  model: string,
  systemInstruction: string,
  contents: GeminiContent[],
  tools?: object[]
): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(
    `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        ...(tools ? { tools } : {}),
      }),
    }
  );
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

async function callWithFallback(
  systemInstruction: string,
  contents: GeminiContent[],
  tools?: object[]
): Promise<{ parts: GeminiPart[] }> {
  let lastError = "";

  for (const model of CHAT_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await callModel(model, systemInstruction, contents, tools);

      if (result.ok) {
        const data = JSON.parse(result.body);
        const parts = data.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) return { parts };
        lastError = "Resposta inesperada do Gemini";
        continue;
      }

      lastError = `${model}: ${result.status} ${result.body}`;
      if (result.status !== 503) break;
      await sleep(400);
    }
  }

  throw new Error(`Gemini chat falhou em todos os modelos. Último erro: ${lastError}`);
}

export interface ToolRunner {
  tools: object[];
  execute: (name: string, args: Record<string, unknown>) => Promise<object>;
}

async function generateChatReplyGemini(
  systemInstruction: string,
  history: ChatTurn[],
  toolRunner?: ToolRunner
): Promise<string> {
  const contents: GeminiContent[] = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  for (let round = 0; round < 5; round++) {
    const { parts } = await callWithFallback(
      systemInstruction,
      contents,
      toolRunner?.tools
    );

    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0 || !toolRunner) {
      const text = parts.map((p) => p.text ?? "").join("");
      if (!text.trim()) throw new Error("Resposta vazia do Gemini");
      return text;
    }

    contents.push({ role: "model", parts });

    const responses: GeminiPart[] = [];
    for (const call of functionCalls) {
      const fc = call.functionCall!;
      const result = await toolRunner.execute(fc.name, fc.args ?? {});
      responses.push({ functionResponse: { name: fc.name, response: result } });
    }
    contents.push({ role: "user", parts: responses });
  }

  throw new Error("Limite de chamadas de ferramenta excedido");
}

export async function generateChatReply(
  systemInstruction: string,
  history: ChatTurn[],
  toolRunner?: ToolRunner
): Promise<string> {
  if (process.env.NVIDIA_API_KEY) {
    try {
      const { generateChatReplyNvidia } = await import("@/lib/nvidia");
      return await generateChatReplyNvidia(systemInstruction, history, toolRunner);
    } catch (nvidiaError) {
      console.error("NVIDIA indisponível, tentando fallback Gemini", nvidiaError);
    }
  }

  return generateChatReplyGemini(systemInstruction, history, toolRunner);
}
