import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;

  try {
    const room = await prisma.room.update({ where: { id }, data });
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: "Raum konnte nicht aktualisiert werden" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Raum konnte nicht gelöscht werden" }, { status: 500 });
  }
}
