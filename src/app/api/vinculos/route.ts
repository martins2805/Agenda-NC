import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criarVinculo, removerVinculo, listarVinculados, type VinculoPar } from "@/lib/vinculos";
import type { VinculoTipo } from "@/generated/prisma/client";

const TIPOS: VinculoTipo[] = ["atividade", "atividadeGeral", "registro", "planilha"];

function isVinculoTipo(value: string | null): value is VinculoTipo {
  return !!value && (TIPOS as string[]).includes(value);
}

// Reservada para consumidores que não fazem sentido embutir no payload do
// objeto inteiro (ex.: AtividadeGeral). Registro/Planilha vinculam a
// Atividade via `atividadeIds` no próprio PATCH/POST (ver src/app/api/registros,
// src/app/api/planilhas) — não passam por aqui.

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const sp = new URL(request.url).searchParams;
  const tipo = sp.get("tipo");
  const id = sp.get("id");
  const tipoOposto = sp.get("tipoOposto");
  if (!isVinculoTipo(tipo) || !id || !isVinculoTipo(tipoOposto)) {
    return NextResponse.json({ error: "Parâmetros tipo/id/tipoOposto obrigatórios" }, { status: 400 });
  }

  const ids = await listarVinculados(prisma, userId, { tipo, id }, tipoOposto);
  return NextResponse.json({ ids });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = (await request.json()) as { a?: VinculoPar; b?: VinculoPar };
  if (!body.a || !body.b || !isVinculoTipo(body.a.tipo) || !isVinculoTipo(body.b.tipo)) {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  await criarVinculo(prisma, userId, body.a, body.b);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = (await request.json()) as { a?: VinculoPar; b?: VinculoPar };
  if (!body.a || !body.b || !isVinculoTipo(body.a.tipo) || !isVinculoTipo(body.b.tipo)) {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  await removerVinculo(prisma, userId, body.a, body.b);
  return NextResponse.json({ ok: true });
}
