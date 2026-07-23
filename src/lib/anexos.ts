import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

// Diretório onde os arquivos anexados ficam em disco. Em produção (Railway)
// deve apontar para um Volume montado (variável UPLOAD_DIR) — sem isso, o
// filesystem do container é efêmero e os anexos somem a cada deploy. Sem a
// variável (dev local), cai numa pasta local ignorada pelo git.
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "anexos");

export const ANEXO_TAMANHO_MAXIMO = 25 * 1024 * 1024; // 25MB

function extensaoDe(nomeOriginal: string): string {
  const ext = path.extname(nomeOriginal);
  // só aceita extensões "normais" (letras/números, até 10 chars) — nunca
  // repassa o nome original pro filesystem, evita path traversal.
  return /^\.[a-zA-Z0-9]{1,10}$/.test(ext) ? ext : "";
}

export async function salvarAnexo(
  nomeArmazenado: string,
  nomeOriginal: string,
  bytes: Buffer
): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, nomeArmazenado), bytes);
}

export function gerarNomeArmazenado(nomeOriginal: string): string {
  return `${crypto.randomUUID()}${extensaoDe(nomeOriginal)}`;
}

export async function lerAnexo(nomeArmazenado: string): Promise<Buffer> {
  return readFile(path.join(UPLOAD_DIR, nomeArmazenado));
}

export async function removerAnexo(nomeArmazenado: string): Promise<void> {
  try {
    await unlink(path.join(UPLOAD_DIR, nomeArmazenado));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") throw error;
  }
}
