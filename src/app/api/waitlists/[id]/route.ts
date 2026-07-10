import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteWaitlistEntryAndReindex, moveWaitlistEntryToPosition } from "@/lib/waitlist-position";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { position } = body;

  if (position === undefined) {
    return NextResponse.json({ error: "Position fehlt" }, { status: 400 });
  }

  const parsed = Number(position);
  if (Number.isNaN(parsed) || Math.floor(parsed) < 1) {
    return NextResponse.json({ error: "Ungültige Position" }, { status: 400 });
  }

  try {
    const waitlistEntry = await prisma.$transaction((tx) =>
      moveWaitlistEntryToPosition({
        tx,
        id,
        requestedPosition: Math.floor(parsed)
      })
    );

    if (!waitlistEntry) {
      return NextResponse.json({ error: "Wartelisteneintrag nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(waitlistEntry);
  } catch (error) {
    return NextResponse.json({ error: "Wartelisteneintrag konnte nicht aktualisiert werden" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const result = await prisma.$transaction((tx) => deleteWaitlistEntryAndReindex({ tx, id }));

    if (!result) {
      return NextResponse.json({ error: "Wartelisteneintrag nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Wartelisteneintrag konnte nicht gelöscht werden" }, { status: 500 });
  }
}
