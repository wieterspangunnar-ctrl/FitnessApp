import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
type PersonalTrainingStatus = "AVAILABLE" | "BOOKED" | "COMPLETED" | "CANCELLED_BY_TRAINER";
const VALID_STATUSES: PersonalTrainingStatus[] = ["AVAILABLE", "BOOKED", "COMPLETED", "CANCELLED_BY_TRAINER"];

function isPersonalTrainingStatus(value: string): value is PersonalTrainingStatus {
  return VALID_STATUSES.includes(value as PersonalTrainingStatus);
}

type UpdatePtSlotBody = {
  status?: string;
  memberId?: string | null;
  billingStatus?: string;
  isFreePremiumSlot?: boolean;
  startTime?: string;
  endTime?: string;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const slot = await prisma.personalTrainingBooking.findUnique({
    where: { id },
    include: {
      trainer: { select: { id: true, firstName: true, lastName: true, hourlyPtRate: true } },
      member: { select: { id: true, firstName: true, lastName: true, membershipTier: { select: { name: true, includedPtSlotsPerMonth: true } } } }
    }
  });

  if (!slot) {
    return NextResponse.json({ error: "Slot nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(slot);
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as UpdatePtSlotBody;

  const slot = await prisma.personalTrainingBooking.findUnique({ where: { id } });
  if (!slot) {
    return NextResponse.json({ error: "Slot nicht gefunden" }, { status: 404 });
  }

  if (body.status !== undefined && !isPersonalTrainingStatus(body.status)) {
    return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
  }

  const validBillingStatuses = ["PENDING", "BILLED_TO_ACCOUNT", "PAID"];
  if (body.billingStatus !== undefined && !validBillingStatuses.includes(body.billingStatus)) {
    return NextResponse.json({ error: "Ungültiger Abrechnungsstatus" }, { status: 400 });
  }

  let member = null;

  if (body.memberId) {
    member = await prisma.member.findUnique({
      where: { id: body.memberId },
      select: { id: true, status: true }
    });

    if (!member) {
      return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
    }

    if (member.status !== "ACTIVE") {
      return NextResponse.json({ error: "Mitglied nicht aktiv" }, { status: 403 });
    }

    if (slot.status !== "AVAILABLE" || slot.memberId) {
      return NextResponse.json({ error: "Slot ist nicht mehr verfügbar" }, { status: 409 });
    }

    if (slot.startTime <= new Date()) {
      return NextResponse.json({ error: "Vergangene oder laufende Slots können nicht gebucht werden" }, { status: 409 });
    }
  }

  const updateData: Record<string, unknown> = {};

  if (body.status !== undefined) updateData.status = body.status;
  if (body.billingStatus !== undefined) updateData.billingStatus = body.billingStatus;
  if (body.isFreePremiumSlot !== undefined) updateData.isFreePremiumSlot = body.isFreePremiumSlot;

  if ("memberId" in body) {
    updateData.memberId = body.memberId ?? null;
    if (body.memberId && body.status === undefined) {
      updateData.status = "BOOKED";
    }
  }

  if (body.startTime !== undefined) {
    const start = new Date(body.startTime);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Ungültige Startzeit" }, { status: 400 });
    }
    updateData.startTime = start;
  }

  if (body.endTime !== undefined) {
    const end = new Date(body.endTime);
    if (Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Ungültige Endzeit" }, { status: 400 });
    }
    updateData.endTime = end;
  }

  if (updateData.startTime instanceof Date || updateData.endTime instanceof Date) {
    const nextStartTime = (updateData.startTime as Date | undefined) ?? slot.startTime;
    const nextEndTime = (updateData.endTime as Date | undefined) ?? slot.endTime;

    if (nextEndTime <= nextStartTime) {
      return NextResponse.json({ error: "Endzeit muss nach der Startzeit liegen" }, { status: 400 });
    }
  }

  if (body.memberId) {
    const updatedCount = await prisma.personalTrainingBooking.updateMany({
      where: {
        id,
        status: "AVAILABLE",
        memberId: null
      },
      data: {
        ...updateData,
        memberId: body.memberId,
        status: (body.status as PersonalTrainingStatus | undefined) ?? "BOOKED"
      }
    });

    if (updatedCount.count === 0) {
      return NextResponse.json({ error: "Slot ist nicht mehr verfügbar" }, { status: 409 });
    }

    const bookedSlot = await prisma.personalTrainingBooking.findUnique({
      where: { id },
      include: {
        trainer: { select: { id: true, firstName: true, lastName: true } },
        member: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return NextResponse.json(bookedSlot);
  }

  const updated = await prisma.personalTrainingBooking.update({
    where: { id },
    data: updateData,
    include: {
      trainer: { select: { id: true, firstName: true, lastName: true } },
      member: { select: { id: true, firstName: true, lastName: true } }
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const slot = await prisma.personalTrainingBooking.findUnique({ where: { id } });
  if (!slot) {
    return NextResponse.json({ error: "Slot nicht gefunden" }, { status: 404 });
  }

  if (slot.status !== "AVAILABLE") {
    return NextResponse.json(
      { error: "Nur freie Slots (AVAILABLE) können gelöscht werden" },
      { status: 409 }
    );
  }

  await prisma.personalTrainingBooking.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
