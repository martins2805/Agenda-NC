import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveWidgetPreferencias, type WidgetPreferenciaBruta } from "@/lib/dashboard-widgets";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const rows = await prisma.widgetPreferencia.findMany({ where: { userId } });
  return NextResponse.json(resolveWidgetPreferencias(rows));
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = (await request.json()) as WidgetPreferenciaBruta[];

  await prisma.$transaction(
    body.map((p) =>
      prisma.widgetPreferencia.upsert({
        where: { userId_widgetId: { userId, widgetId: p.widgetId } },
        create: { userId, widgetId: p.widgetId, ordem: p.ordem, visivel: p.visivel, tamanho: p.tamanho },
        update: { ordem: p.ordem, visivel: p.visivel, tamanho: p.tamanho },
      })
    )
  );

  const rows = await prisma.widgetPreferencia.findMany({ where: { userId } });
  return NextResponse.json(resolveWidgetPreferencias(rows));
}
