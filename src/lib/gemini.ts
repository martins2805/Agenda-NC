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

async function callModel(
  model: string,
  systemInstruction: string,
  history: ChatTurn[]
): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(
    `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: history.map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.text }],
        })),
      }),
    }
  );
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

export async function generateChatReply(
  systemInstruction: string,
  history: ChatTurn[]
): Promise<string> {
  let lastError = "";

  for (const model of CHAT_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await callModel(model, systemInstruction, history);

      if (result.ok) {
        const data = JSON.parse(result.body);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text === "string") return text;
        lastError = "Resposta inesperada do Gemini";
        continue;
      }

      lastError = `${model}: ${result.status} ${result.body}`;
      // 503 = sobrecarga temporária do modelo; vale tentar de novo ou trocar de modelo.
      if (result.status !== 503) break;
      await sleep(400);
    }
  }

  throw new Error(`Gemini chat falhou em todos os modelos. Último erro: ${lastError}`);
}
