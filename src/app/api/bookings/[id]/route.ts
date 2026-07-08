import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const courseStart = new Date(booking.course.startTime).getTime();
    const now = Date.now();
    const hoursBefore = (courseStart - now) / (1000 * 60 * 60);

    let newStatus: "CANCELLED_TIMELY" | "CANCELLED_LATE" = "CANCELLED_TIMELY";

    if (hoursBefore < 2) {
      const hasFreeLate = Boolean(booking.member.membershipTier?.hasFreeLateCancellation);
      newStatus = hasFreeLate ? "CANCELLED_TIMELY" : "CANCELLED_LATE";
    }

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
