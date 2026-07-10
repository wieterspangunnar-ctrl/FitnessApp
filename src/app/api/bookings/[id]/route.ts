import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCancellationStatus } from "@/lib/cancellation-status";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        member: { include: { membershipTier: true } },
        course: { select: { id: true, startTime: true } }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Nur bestätigte Buchungen können storniert werden" }, { status: 400 });
    }

    const newStatus = getCancellationStatus({
      courseStart: booking.course.startTime,
      now: new Date(),
      hasFreeLateCancellation: booking.member.membershipTier.hasFreeLateCancellation
    });

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: newStatus },
      include: { member: true, course: { include: { courseType: true, room: true, trainer: true } } }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Stornierung fehlgeschlagen" }, { status: 500 });
  }
}
