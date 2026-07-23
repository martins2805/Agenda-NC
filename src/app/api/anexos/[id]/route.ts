import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lerAnexo, removerAnexo } from "@/lib/anexos";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const anexo = await prisma.anexo.findFirst({ where: { id, userId } });
  if (!anexo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await lerAnexo(anexo.nomeArmazenado);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": anexo.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(anexo.nomeOriginal)}"`,
      "Content-Length": String(anexo.tamanho),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const anexo = await prisma.anexo.findFirst({ where: { id, userId } });
  if (!anexo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.anexo.delete({ where: { id } });
  await removerAnexo(anexo.nomeArmazenado);

  return NextResponse.json({ ok: true });
}
