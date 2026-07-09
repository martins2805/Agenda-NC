import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, active } = body as { name?: string; active?: boolean };

  const data: { name?: string; active?: boolean } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof active === "boolean") data.active = active;

  const item = await prisma.lookupItem.update({ where: { id }, data });
  return NextResponse.json(item);
}
