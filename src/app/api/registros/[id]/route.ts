import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  syncKnowledgeChunk,
  deleteKnowledgeChunk,
  serializeRegistro,
} from "@/lib/knowledge-sync";
import { syncVinculos, deleteVinculosDe, listarVinculados } from "@/lib/vinculos";
import type { Registro } from "@/lib/types";

const include = { tabs: true };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;

  const owned = await prisma.registro.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as Registro;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.registroTab.deleteMany({ where: { registroId: id } });

    const registro = await tx.registro.update({
      where: { id },
      data: {
        nome: body.nome,
        empresaId: body.empresaId,
        unidadeId: body.unidadeId,
        contato: body.contato,
        assunto: body.assunto,
        categoriaIds: body.categoriaIds,
        tabs: {
          create: body.tabs.map((t, i) => ({
            id: t.id,
            titulo: t.titulo,
            conteudo: t.conteudo,
            ordem: i,
          })),
        },
      },
      include,
    });
    await syncVinculos(tx, userId, { tipo: "registro", id }, "atividade", body.atividadeIds ?? []);
    await syncVinculos(tx, userId, { tipo: "registro", id }, "atividadeGeral", body.atividadeGeralIds ?? []);
    return registro;
  });

  const atividadeIds = await listarVinculados(prisma, userId, { tipo: "registro", id }, "atividade");
  const atividadeGeralIds = await listarVinculados(prisma, userId, { tipo: "registro", id }, "atividadeGeral");

  serializeRegistro(updated)
    .then((content) => syncKnowledgeChunk(userId, "registro", updated.id, content))
    .catch((error) => console.error("Falha ao indexar registro", error));

  return NextResponse.json({
    ...updated,
    tabs: updated.tabs.sort((a, b) => a.ordem - b.ordem),
    atividadeIds,
    atividadeGeralIds,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const permanent = new URL(request.url).searchParams.get("permanent") === "1";

  if (permanent) {
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.registro.deleteMany({ where: { id, userId } });
      if (deleted.count > 0) await deleteVinculosDe(tx, userId, "registro", id);
      return deleted;
    });
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    deleteKnowledgeChunk(userId, "registro", id).catch((error) =>
      console.error("Falha ao remover indexação", error)
    );
    return NextResponse.json({ ok: true });
  }

  const result = await prisma.registro.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  deleteKnowledgeChunk(userId, "registro", id).catch((error) =>
    console.error("Falha ao remover indexação", error)
  );
  return NextResponse.json({ ok: true });
}
