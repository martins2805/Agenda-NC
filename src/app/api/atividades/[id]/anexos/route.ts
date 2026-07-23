import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ANEXO_TAMANHO_MAXIMO, gerarNomeArmazenado, salvarAnexo } from "@/lib/anexos";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const owned = await prisma.atividade.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (file.size > ANEXO_TAMANHO_MAXIMO) {
    return NextResponse.json({ error: "Arquivo maior que 25MB" }, { status: 413 });
  }

  const nomeArmazenado = gerarNomeArmazenado(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  await salvarAnexo(nomeArmazenado, file.name, bytes);

  const anexo = await prisma.anexo.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      atividadeId: id,
      nomeOriginal: file.name,
      nomeArmazenado,
      mimeType: file.type || "application/octet-stream",
      tamanho: file.size,
    },
  });

  return NextResponse.json(
    {
      id: anexo.id,
      nomeOriginal: anexo.nomeOriginal,
      mimeType: anexo.mimeType,
      tamanho: anexo.tamanho,
      createdAt: anexo.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
