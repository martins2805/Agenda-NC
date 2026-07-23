import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const body = await request.json();
  const { name, active, cor, ordem } = body as {
    name?: string;
    active?: boolean;
    cor?: string | null;
    ordem?: number;
  };

  const data: { name?: string; active?: boolean; cor?: string | null; ordem?: number } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof active === "boolean") data.active = active;
  if (cor === null || (typeof cor === "string" && ["base-1", "base-2", "base-3", "base-4"].includes(cor)))
    data.cor = cor;
  if (typeof ordem === "number") data.ordem = ordem;

  const result = await prisma.lookupItem.updateMany({ where: { id, userId }, data });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const item = await prisma.lookupItem.findUnique({ where: { id } });
  return NextResponse.json(item);
}
