const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const CHAT_MODEL = "gemini-flash-latest";
const EMBEDDING_MODEL = "gemini-embedding-001";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurada");
  return key;
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

export async function generateChatReply(
  systemInstruction: string,
  history: ChatTurn[]
): Promise<string> {
  const res = await fetch(
    `${GEMINI_BASE_URL}/models/${CHAT_MODEL}:generateContent?key=${apiKey()}`,
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

  if (!res.ok) {
    throw new Error(`Gemini chat falhou: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Resposta inesperada do Gemini");
  }
  return text;
}
