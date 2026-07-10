import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCancellationStatus } from "@/lib/cancellation-status";
import { deleteWaitlistEntryAndReindex } from "@/lib/waitlist-position";

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

    // Transaktionale Abwicklung: Stornierung + automatisches Nachruecken
    const updated = await prisma.$transaction(async (tx) => {
      const cancellation = await tx.booking.update({
        where: { id },
        data: { status: newStatus },
        include: { member: true, course: { include: { courseType: true, room: true, trainer: true } } }
      });

      // Nachruecken bei rechtzeitiger Stornierung (BR2)
      if (newStatus === "CANCELLED_TIMELY") {
        const nextOnWaitlist = await tx.waitlist.findFirst({
          where: {
            courseId: booking.course.id,
            position: 1
          },
          include: {
            member: true,
            course: {
              include: { courseType: true, room: true, trainer: true }
            }
          }
        });

        if (nextOnWaitlist) {
          // Neue Booking für Nachruecker anlegen
          await tx.booking.create({
            data: {
              memberId: nextOnWaitlist.memberId,
              courseId: nextOnWaitlist.courseId,
              status: "CONFIRMED",
              bookedAt: new Date()
            }
          });

          // Wartelisteneintrag löschen und restliche reindexieren
          await deleteWaitlistEntryAndReindex({
            tx,
            id: nextOnWaitlist.id
          });

          // TODO: FZ-040 - Benachrichtigung an Nachruecker senden
          // sendWaitlistMoveUpNotification(nextOnWaitlist.member, nextOnWaitlist.course);
        }
      }

      return cancellation;
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Stornierung fehlgeschlagen" }, { status: 500 });
  }
}
