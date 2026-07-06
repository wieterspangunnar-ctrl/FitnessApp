import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function parseOptionalInt(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const {
    name,
    monthlyPrice,
    maxCoursesPerMonth,
    hasVideoAccess,
    bookingWindowDays,
    hasFreeLateCancellation,
    includedPtSlotsPerMonth
  } = body;

  const data: Record<string, unknown> = {};

  if (name !== undefined) data.name = name;
  if (monthlyPrice !== undefined) data.monthlyPrice = new Prisma.Decimal(monthlyPrice.toString());
  if (maxCoursesPerMonth !== undefined) data.maxCoursesPerMonth = parseOptionalInt(maxCoursesPerMonth);
  if (hasVideoAccess !== undefined) data.hasVideoAccess = parseBoolean(hasVideoAccess);
  if (bookingWindowDays !== undefined) data.bookingWindowDays = Number(bookingWindowDays);
  if (hasFreeLateCancellation !== undefined) data.hasFreeLateCancellation = parseBoolean(hasFreeLateCancellation);
  if (includedPtSlotsPerMonth !== undefined) data.includedPtSlotsPerMonth = Number(includedPtSlotsPerMonth);

  try {
    const tier = await prisma.membershipTier.update({
      where: { id },
      data,
    });

    return NextResponse.json(tier);
  } catch (error) {
    return NextResponse.json({ error: "Tarif konnte nicht aktualisiert werden" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.membershipTier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Tarif konnte nicht gelöscht werden" }, { status: 500 });
  }
}
