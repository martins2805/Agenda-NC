import { prisma } from "@/lib/prisma";
import type { LookupKind } from "@/generated/prisma/client";

const VALID_KINDS: LookupKind[] = [
  "empresa",
  "unidade",
  "assunto",
  "tipoAtividade",
  "servicoProduto",
  "escopo",
  "amostragem",
  "categoriaRegistro",
  "categoriaPlanilha",
];

export function isValidLookupKind(kind: string): kind is LookupKind {
  return (VALID_KINDS as string[]).includes(kind);
}

/**
 * Encontra um LookupItem ativo pelo nome (case-insensitive); cria um novo
 * se não existir. Usado quando o chat cria/edita registros por nome em vez
 * de id, espelhando o comportamento das listas gerenciáveis da UI.
 */
export async function resolveOrCreateLookup(
  userId: string,
  kind: LookupKind,
  name: string
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = await prisma.lookupItem.findFirst({
    where: { userId, kind, active: true, name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing.id;

  const created = await prisma.lookupItem.create({
    data: { userId, kind, name: trimmed },
  });
  return created.id;
}

export async function resolveOrCreateLookups(
  userId: string,
  kind: LookupKind,
  names: string[] | undefined
): Promise<string[]> {
  if (!names || names.length === 0) return [];
  const ids: string[] = [];
  for (const name of names) {
    const id = await resolveOrCreateLookup(userId, kind, name);
    if (id) ids.push(id);
  }
  return ids;
}
