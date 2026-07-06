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

export async function GET() {
  const trainers = await prisma.trainer.findMany({ orderBy: { lastName: "asc" } });
  return NextResponse.json({ trainers });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, hourlyPtRate } = body;

  if (!firstName || !lastName || !email || hourlyPtRate == null) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const rate = parseHourlyRate(hourlyPtRate);
  if (rate === null) {
    return NextResponse.json({ error: "Ungültiger Stundensatz" }, { status: 400 });
  }

  try {
    const trainer = await prisma.trainer.create({
      data: {
        firstName,
        lastName,
        email,
        hourlyPtRate: new Prisma.Decimal(rate.toString())
      }
    });

    return NextResponse.json(trainer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Trainer konnte nicht erstellt werden" }, { status: 500 });
  }
}
