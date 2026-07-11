import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.noShowRestriction.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Sperre wurde aufgehoben" });
  } catch (error) {
    return NextResponse.json({ error: "Sperre konnte nicht gelöscht werden" }, { status: 500 });
  }
}
