import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

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

  const validStatuses = ["AVAILABLE", "BOOKED", "COMPLETED", "CANCELLED_BY_TRAINER"];
  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
  }

  const validBillingStatuses = ["PENDING", "BILLED_TO_ACCOUNT", "PAID"];
  if (body.billingStatus !== undefined && !validBillingStatuses.includes(body.billingStatus)) {
    return NextResponse.json({ error: "Ungültiger Abrechnungsstatus" }, { status: 400 });
  }

  // Wenn Member zugewiesen wird, muss Slot AVAILABLE sein
  if (body.memberId && slot.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Slot ist nicht mehr verfügbar" }, { status: 409 });
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
