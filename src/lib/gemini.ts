const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
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

async function callModelWithRetry(
  model: string,
  systemInstruction: string,
  contents: GeminiContent[],
  tools?: object[]
): Promise<GeminiPart[]> {
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await callModel(model, systemInstruction, contents, tools);

    if (result.ok) {
      const data = JSON.parse(result.body);
      const parts = data.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) return parts;
      lastError = `Resposta inesperada do Gemini (${model})`;
      continue;
    }

    lastError = `${model}: ${result.status} ${result.body}`;
    if (result.status !== 503) break;
    await sleep(400);
  }

  throw new Error(lastError);
}

export interface ToolRunner {
  tools: object[];
  execute: (name: string, args: Record<string, unknown>) => Promise<object>;
}

// Runs one Gemini model to completion, including its own tool-calling round
// trips. A failure here is caught by generateChatReply, which moves on to
// the next model/provider in MODEL_SEQUENCE.
export async function attemptGeminiModel(
  model: string,
  systemInstruction: string,
  history: ChatTurn[],
  toolRunner?: ToolRunner
): Promise<string> {
  const contents: GeminiContent[] = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  for (let round = 0; round < 5; round++) {
    const parts = await callModelWithRetry(model, systemInstruction, contents, toolRunner?.tools);

    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0 || !toolRunner) {
      const text = parts.map((p) => p.text ?? "").join("");
      if (!text.trim()) throw new Error(`Resposta vazia do Gemini (${model})`);
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

  throw new Error(`Limite de chamadas de ferramenta excedido (Gemini ${model})`);
}

type Provider = "gemini" | "nvidia";

// Ordered fallback sequence across both providers: try each model in turn
// and only move to the next one if the current one fails outright (network
// error, non-2xx, empty/malformed response). Numbering follows the sequence
// as specified; gaps (8, 9, 15) were intentionally not assigned a model.
const MODEL_SEQUENCE: ReadonlyArray<{ provider: Provider; model: string }> = [
  { provider: "gemini", model: "gemini-3.5-flash" }, // 1
  { provider: "nvidia", model: "deepseek-ai/deepseek-v3" }, // 2
  { provider: "nvidia", model: "deepseek-ai/deepseek-r1" }, // 3
  { provider: "nvidia", model: "meta/llama-4-maverick-17b-128e-instruct" }, // 4
  { provider: "gemini", model: "gemini-3.1-pro-preview" }, // 5
  { provider: "gemini", model: "gemini-3.1-flash-lite" }, // 6
  { provider: "gemini", model: "gemini-2.5-flash" }, // 7
  { provider: "nvidia", model: "meta/llama-3.3-70b-instruct" }, // 10
  { provider: "nvidia", model: "meta/llama-4-scout-17b-16e-instruct" }, // 11
  { provider: "nvidia", model: "qwen/qwen2.5-72b-instruct" }, // 12
  { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct" }, // 13
  { provider: "nvidia", model: "nvidia/llama-3.3-nemotron-super-49b-v1" }, // 14
  { provider: "nvidia", model: "meta/llama-3.1-70b-instruct" }, // 16 (o que testamos e vimos "robótico")
];

export async function generateChatReply(
  systemInstruction: string,
  history: ChatTurn[],
  toolRunner?: ToolRunner
): Promise<string> {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasNvidia = !!process.env.NVIDIA_API_KEY;

  const errors: string[] = [];

  for (const { provider, model } of MODEL_SEQUENCE) {
    if (provider === "gemini" && !hasGemini) continue;
    if (provider === "nvidia" && !hasNvidia) continue;

    try {
      if (provider === "gemini") {
        return await attemptGeminiModel(model, systemInstruction, history, toolRunner);
      }
      const { attemptNvidiaModel } = await import("@/lib/nvidia");
      return await attemptNvidiaModel(model, systemInstruction, history, toolRunner);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Modelo ${provider}/${model} falhou, tentando o próximo da sequência`, message);
      errors.push(`${provider}/${model}: ${message}`);
    }
  }

  throw new Error(`Todos os modelos da sequência de fallback falharam.\n${errors.join("\n")}`);
}
