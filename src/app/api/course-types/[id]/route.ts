import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;

  try {
    const ct = await prisma.courseType.update({ where: { id }, data });
    return NextResponse.json(ct);
  } catch (error) {
    return NextResponse.json({ error: "Kursart konnte nicht aktualisiert werden" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.courseType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Kursart konnte nicht gelöscht werden" }, { status: 500 });
  }
}
