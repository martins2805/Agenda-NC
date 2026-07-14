import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOOKUP_SEED_DATA } from "@/lib/lookup-seed-data";
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
  "tipoAtividadeGeral",
  "setorInterno",
];

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const count = await prisma.lookupItem.count({ where: { userId } });
  if (count === 0) {
    await prisma.lookupItem.createMany({
      data: LOOKUP_SEED_DATA.map((d) => ({ userId, kind: d.kind as LookupKind, name: d.name })),
    });
  }

  const items = await prisma.lookupItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = await request.json();
  const { id, kind, name, empresaId } = body as {
    id?: string;
    kind?: string;
    name?: string;
    empresaId?: string | null;
  };

  if (!kind || !VALID_KINDS.includes(kind as LookupKind) || !name?.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const item = await prisma.lookupItem.create({
    data: {
      ...(id ? { id } : {}),
      userId,
      kind: kind as LookupKind,
      name: name.trim(),
      empresaId: empresaId ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
