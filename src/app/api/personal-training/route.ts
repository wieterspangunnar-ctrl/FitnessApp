import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreatePtSlotBody = {
  trainerId?: string;
  startTime?: string;
  endTime?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const onlyAvailable = searchParams.get("onlyAvailable") === "true";

  const slots = await prisma.personalTrainingBooking.findMany({
    where: onlyAvailable
      ? {
          status: "AVAILABLE",
          startTime: { gte: new Date() }
        }
      : undefined,
    include: {
      trainer: { select: { id: true, firstName: true, lastName: true, hourlyPtRate: true } },
      member: { select: { id: true, firstName: true, lastName: true, membershipTier: { select: { name: true, includedPtSlotsPerMonth: true } } } }
    },
    orderBy: { startTime: "asc" }
  });

  return NextResponse.json({ slots });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreatePtSlotBody;
  const { trainerId, startTime, endTime } = body;

  if (!trainerId || !startTime || !endTime) {
    return NextResponse.json({ error: "Pflichtfelder fehlen: trainerId, startTime, endTime" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Ungültige Zeitangaben" }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json({ error: "Endzeit muss nach der Startzeit liegen" }, { status: 400 });
  }

  const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });
  if (!trainer) {
    return NextResponse.json({ error: "Trainer nicht gefunden" }, { status: 404 });
  }

  // Überschneidungs-Prüfung für denselben Trainer
  const overlap = await prisma.personalTrainingBooking.findFirst({
    where: {
      trainerId,
      status: { not: "CANCELLED_BY_TRAINER" },
      startTime: { lt: end },
      endTime: { gt: start }
    }
  });

  if (overlap) {
    return NextResponse.json({ error: "Zeitslot überschneidet sich mit einem bestehenden Termin des Trainers" }, { status: 409 });
  }

  const slot = await prisma.personalTrainingBooking.create({
    data: {
      trainerId,
      startTime: start,
      endTime: end,
      status: "AVAILABLE",
      billingStatus: "PENDING"
    },
    include: {
      trainer: { select: { id: true, firstName: true, lastName: true } }
    }
  });

  return NextResponse.json(slot, { status: 201 });
}
