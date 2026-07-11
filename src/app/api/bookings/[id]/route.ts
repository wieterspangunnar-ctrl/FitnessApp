import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCancellationStatus } from "@/lib/cancellation-status";
import { deleteWaitlistEntryAndReindex } from "@/lib/waitlist-position";
import { notificationDispatcher, type WaitlistMoveUpNotificationPayload } from "@/lib/notifications";

const BOOKING_STATUSES = ["CONFIRMED", "CANCELLED_LATE", "CANCELLED_TIMELY", "NO_SHOW"] as const;
const LATE_CANCELLATION_FEE_CENTS = 500;
type BookingStatus = (typeof BOOKING_STATUSES)[number];

type UpdateBookingBody = {
  status?: unknown;
};

function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && BOOKING_STATUSES.includes(value as BookingStatus);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as UpdateBookingBody;

  if (body.status === undefined) {
    return NextResponse.json({ error: "Status ist erforderlich" }, { status: 400 });
  }

  if (!isBookingStatus(body.status)) {
    return NextResponse.json({ error: "Ungültiger Buchungsstatus" }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: body.status },
      include: {
        member: true,
        course: {
          include: { courseType: true, room: true, trainer: true }
        }
      }
    });

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: "Buchung konnte nicht aktualisiert werden" }, { status: 500 });
  }
}

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
    const result = await prisma.$transaction(async (tx) => {
      let waitlistMoveUpNotification: WaitlistMoveUpNotificationPayload | null = null;

      const cancellation = await tx.booking.update({
        where: { id },
        data: {
          status: newStatus,
          lateCancellationFeeCents:
            newStatus === "CANCELLED_LATE" ? LATE_CANCELLATION_FEE_CENTS : null,
          lateCancellationFeeBookedAt: newStatus === "CANCELLED_LATE" ? new Date() : null
        },
        include: { member: true, course: { include: { courseType: true, room: true, trainer: true } } }
      });

      if (newStatus === "CANCELLED_LATE") {
        await tx.customerAccountEntry.upsert({
          where: {
            bookingId_type: {
              bookingId: booking.id,
              type: "LATE_CANCELLATION_FEE"
            }
          },
          create: {
            memberId: booking.memberId,
            bookingId: booking.id,
            type: "LATE_CANCELLATION_FEE",
            amountCents: LATE_CANCELLATION_FEE_CENTS,
            billingStatus: "PENDING",
            description: "Spaete Kursstornierung (< 2 Stunden)"
          },
          update: {
            amountCents: LATE_CANCELLATION_FEE_CENTS,
            billingStatus: "PENDING",
            billedAt: null,
            paidAt: null,
            description: "Spaete Kursstornierung (< 2 Stunden)"
          }
        });
      }

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

          waitlistMoveUpNotification = {
            member: {
              id: nextOnWaitlist.member.id,
              email: nextOnWaitlist.member.email,
              firstName: nextOnWaitlist.member.firstName,
              lastName: nextOnWaitlist.member.lastName
            },
            course: {
              id: nextOnWaitlist.course.id,
              startTime: nextOnWaitlist.course.startTime,
              courseTypeName: nextOnWaitlist.course.courseType.name
            }
          };
        }
      }

      return {
        cancellation,
        waitlistMoveUpNotification
      };
    });

    if (result.waitlistMoveUpNotification) {
      const payload = result.waitlistMoveUpNotification;

      try {
        await notificationDispatcher.sendWaitlistMoveUpNotification(payload);
      } catch (notificationError) {
        console.error("WAITLIST_MOVE_UP_NOTIFICATION_FAILED", {
          memberId: payload.member.id,
          courseId: payload.course.id,
          error: notificationError instanceof Error ? notificationError.message : "Unbekannter Fehler"
        });
      }
    }

    return NextResponse.json(result.cancellation);
  } catch (error) {
    return NextResponse.json({ error: "Stornierung fehlgeschlagen" }, { status: 500 });
  }
}
