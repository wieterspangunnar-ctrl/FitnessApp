import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCourseWithinBookingWindow } from "@/lib/booking-window";
import { hasReachedMonthlyBookingLimit } from "@/lib/booking-limit";

type CreateBookingBody = {
  memberId?: string;
  courseId?: string;
};

function getCurrentMonthWindow(now: Date) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { startOfMonth, startOfNextMonth };
}

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: {
      member: true,
      course: {
        include: { courseType: true, room: true, trainer: true }
      }
    },
    orderBy: { bookedAt: "desc" }
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateBookingBody;
  const { memberId, courseId } = body;

  if (!memberId || !courseId) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { membershipTier: true }
  });
  if (!member) {
    return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, startTime: true }
  });
  if (!course) {
    return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
  }

  const isVisibleForMember = isCourseWithinBookingWindow(
    course.startTime,
    member.membershipTier.bookingWindowDays
  );

  if (!isVisibleForMember) {
    return NextResponse.json(
      {
        error: `Buchung nicht möglich. Dein Buchungsfenster umfasst nur die nächsten ${member.membershipTier.bookingWindowDays} Tage.`
      },
      { status: 403 }
    );
  }

  // Stelle sicher, dass nur aktive Mitglieder buchen
  if (member.status !== "ACTIVE") {
    return NextResponse.json({ error: "Mitglied nicht aktiv" }, { status: 403 });
  }

  // Lade Kurs-Metadaten (Kapazität)
  const fullCourse = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, maxParticipants: true }
  });

  if (!fullCourse) {
    return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const confirmedCount = await tx.booking.count({
        where: { courseId, status: "CONFIRMED" }
      });

      const existingBooking = await tx.booking.findFirst({
        where: { memberId, courseId }
      });
      if (existingBooking) {
        throw { code: "ALREADY_BOOKED" };
      }

      const existingWait = await tx.waitlist.findFirst({
        where: { memberId, courseId }
      });
      if (existingWait) {
        throw { code: "ALREADY_WAITLISTED" };
      }

      if (member.membershipTier.maxCoursesPerMonth != null) {
        const { startOfMonth, startOfNextMonth } = getCurrentMonthWindow(new Date());
        const activeBookingsThisMonth = await tx.booking.count({
          where: {
            memberId,
            status: "CONFIRMED",
            course: {
              startTime: {
                gte: startOfMonth,
                lt: startOfNextMonth
              }
            }
          }
        });

        if (
          hasReachedMonthlyBookingLimit(
            activeBookingsThisMonth,
            member.membershipTier.maxCoursesPerMonth
          )
        ) {
          throw {
            code: "MONTHLY_LIMIT_REACHED",
            limit: member.membershipTier.maxCoursesPerMonth
          };
        }
      }

      if (confirmedCount < fullCourse.maxParticipants) {
        const booking = await tx.booking.create({
          data: { memberId, courseId },
          include: { member: true, course: { include: { courseType: true, room: true, trainer: true } } }
        });

        return { type: "booking", payload: booking };
      }

      // Kurs voll -> Waitlist platzieren
      const lastPos = await tx.waitlist.findFirst({
        where: { courseId },
        orderBy: { position: "desc" },
        select: { position: true }
      });

      const position = lastPos ? lastPos.position + 1 : 1;

      const wait = await tx.waitlist.create({
        data: { memberId, courseId, position },
        include: { member: true, course: { include: { courseType: true, room: true, trainer: true } } }
      });

      return { type: "waitlist", payload: wait };
    });

    if (result.type === "booking") {
      return NextResponse.json(result.payload, { status: 201 });
    }

    return NextResponse.json(result.payload, { status: 201 });
  } catch (error) {
    const e = error as any;
    if (e && e.code === "P2002") {
      return NextResponse.json({ error: "Ein Eintrag existiert bereits" }, { status: 409 });
    }

    if (e && e.code === "ALREADY_BOOKED") {
      return NextResponse.json({ error: "Mitglied hat diesen Kurs bereits gebucht" }, { status: 409 });
    }

    if (e && e.code === "ALREADY_WAITLISTED") {
      return NextResponse.json({ error: "Mitglied steht bereits auf der Warteliste" }, { status: 409 });
    }

    if (e && e.code === "MONTHLY_LIMIT_REACHED") {
      return NextResponse.json(
        { error: `Du hast das Monatslimit von ${e.limit} aktiven Kursbuchungen erreicht.` },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: "Buchung konnte nicht erstellt werden" }, { status: 500 });
  }
}
