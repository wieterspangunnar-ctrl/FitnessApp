import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseHourlyRate(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, email, hourlyPtRate } = body;

  const data: Record<string, unknown> = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (email !== undefined) data.email = email;
  if (hourlyPtRate !== undefined) {
    const rate = parseHourlyRate(hourlyPtRate);
    if (rate === null) {
      return NextResponse.json({ error: "Ungültiger Stundensatz" }, { status: 400 });
    }
    data.hourlyPtRate = new Prisma.Decimal(rate.toString());
  }

  try {
    const trainer = await prisma.trainer.update({
      where: { id },
      data
    });

    return NextResponse.json(trainer);
  } catch (error) {
    return NextResponse.json({ error: "Trainer konnte nicht aktualisiert werden" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.trainer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Trainer konnte nicht gelöscht werden" }, { status: 500 });
  }
}
