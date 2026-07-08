import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { position } = body;

  const data: Record<string, unknown> = {};
  if (position !== undefined) {
    const parsed = Number(position);
    if (Number.isNaN(parsed) || Math.floor(parsed) < 1) {
      return NextResponse.json({ error: "Ungültige Position" }, { status: 400 });
    }
    data.position = Math.floor(parsed);
  }

  try {
    const waitlistEntry = await prisma.waitlist.update({ where: { id }, data });
    return NextResponse.json(waitlistEntry);
  } catch (error) {
    return NextResponse.json({ error: "Wartelisteneintrag konnte nicht aktualisiert werden" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.waitlist.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Wartelisteneintrag konnte nicht gelöscht werden" }, { status: 500 });
  }
}
