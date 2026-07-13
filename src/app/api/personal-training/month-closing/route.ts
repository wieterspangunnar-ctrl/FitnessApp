import { NextResponse } from "next/server";

import { getOpenPersonalTrainingChargesDashboardData } from "@/lib/personal-training-open-items";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await getOpenPersonalTrainingChargesDashboardData();

  return NextResponse.json(data);
}

export async function POST() {
  const openEntries = await getOpenPersonalTrainingChargesDashboardData();
  const now = new Date();

  if (openEntries.items.length === 0) {
    return NextResponse.json({
      updatedAccountEntries: 0,
      updatedPersonalTrainingBookings: 0,
      processedAt: now.toISOString()
    });
  }

  const accountEntryIds = openEntries.items.map((item) => item.id);
  const personalTrainingBookingIds = Array.from(
    new Set(
      openEntries.items
        .map((item) => item.personalTrainingBooking?.id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const result = await prisma.$transaction(async (tx) => {
    const updatedAccountEntries = await tx.customerAccountEntry.updateMany({
      where: {
        id: { in: accountEntryIds },
        type: "PERSONAL_TRAINING_CHARGE",
        billingStatus: "PENDING"
      },
      data: {
        billingStatus: "BILLED_TO_ACCOUNT",
        billedAt: now
      }
    });

    let updatedPersonalTrainingBookingsCount = 0;

    if (personalTrainingBookingIds.length > 0) {
      const updatedPersonalTrainingBookings = await tx.personalTrainingBooking.updateMany({
        where: {
          id: { in: personalTrainingBookingIds },
          billingStatus: "PENDING"
        },
        data: {
          billingStatus: "BILLED_TO_ACCOUNT"
        }
      });

      updatedPersonalTrainingBookingsCount = updatedPersonalTrainingBookings.count;
    }

    return {
      updatedAccountEntries: updatedAccountEntries.count,
      updatedPersonalTrainingBookings: updatedPersonalTrainingBookingsCount
    };
  });

  return NextResponse.json({
    ...result,
    processedAt: now.toISOString()
  });
}