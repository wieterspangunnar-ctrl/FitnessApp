import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultMembershipTiers } from "@/lib/member-seed";

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

export async function GET() {
  const tiers = await ensureDefaultMembershipTiers();
  return NextResponse.json({ tiers });
}

export async function POST(request: Request) {
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

  if (!name || !monthlyPrice || bookingWindowDays == null || hasVideoAccess == null || hasFreeLateCancellation == null || includedPtSlotsPerMonth == null) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const bookingWindow = Number(bookingWindowDays);
  const includedPtSlots = Number(includedPtSlotsPerMonth);
  const maxCourses = parseOptionalInt(maxCoursesPerMonth);

  if (Number.isNaN(bookingWindow) || Number.isNaN(includedPtSlots)) {
    return NextResponse.json({ error: "Ungültige numerische Werte" }, { status: 400 });
  }

  try {
    const tier = await prisma.membershipTier.create({
      data: {
        name,
        monthlyPrice: new Prisma.Decimal(monthlyPrice.toString()),
        maxCoursesPerMonth: maxCourses,
        hasVideoAccess: parseBoolean(hasVideoAccess),
        bookingWindowDays: bookingWindow,
        hasFreeLateCancellation: parseBoolean(hasFreeLateCancellation),
        includedPtSlotsPerMonth: includedPtSlots
      }
    });

    return NextResponse.json(tier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Tarif konnte nicht erstellt werden" }, { status: 500 });
  }
}
