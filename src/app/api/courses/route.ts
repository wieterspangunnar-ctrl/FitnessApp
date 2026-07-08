import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCourseWithinBookingWindow } from "@/lib/booking-window";

type CreateCourseBody = {
  courseTypeId?: string;
  startTime?: string;
  endTime?: string;
  maxParticipants?: unknown;
  roomId?: string;
  trainerId?: string;
};

function parseDateTime(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseInteger(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : Math.floor(parsed);
}

async function getCourseCapacityMap() {
  const confirmedBookings = await prisma.booking.groupBy({
    by: ["courseId"],
    where: { status: "CONFIRMED" },
    _count: { courseId: true }
  });

  return new Map(confirmedBookings.map((entry) => [entry.courseId, entry._count.courseId]));
}

function enrichCoursesWithCapacity<T extends { id: string; maxParticipants: number }>(
  courses: T[],
  capacityByCourseId: Map<string, number>
) {
  return courses.map((course) => {
    const confirmedBookingCount = capacityByCourseId.get(course.id) ?? 0;

    return {
      ...course,
      confirmedBookingCount,
      availableSpots: Math.max(course.maxParticipants - confirmedBookingCount, 0)
    };
  });
}

async function isTrainerQualifiedForCourse(trainerId: string, courseTypeId: string) {
  const qualification = await prisma.trainerQualification.findFirst({
    where: {
      trainerId,
      courseTypeId
    },
    select: { id: true }
  });

  return Boolean(qualification);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (memberId) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { membershipTier: true }
    });

    if (!member) {
      return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
    }

    const now = new Date();
    const courses = await prisma.course.findMany({
      include: {
        courseType: true,
        room: true,
        trainer: true
      },
      orderBy: { startTime: "asc" }
    });

    const capacityByCourseId = await getCourseCapacityMap();
    const visibleCourses = enrichCoursesWithCapacity(
      courses.filter((course) =>
        isCourseWithinBookingWindow(course.startTime, member.membershipTier.bookingWindowDays, now)
      ),
      capacityByCourseId
    );

    return NextResponse.json({ courses: visibleCourses });
  }

  const courses = await prisma.course.findMany({
    include: {
      courseType: true,
      room: true,
      trainer: true
    },
    orderBy: { startTime: "asc" }
  });

  const capacityByCourseId = await getCourseCapacityMap();
  const coursesWithCapacity = enrichCoursesWithCapacity(courses, capacityByCourseId);

  return NextResponse.json({ courses: coursesWithCapacity });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateCourseBody;
  const { courseTypeId, startTime, endTime, maxParticipants, roomId, trainerId } = body;

  if (!courseTypeId || !startTime || !endTime || maxParticipants == null || !roomId || !trainerId) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const start = parseDateTime(startTime);
  const end = parseDateTime(endTime);
  const participants = parseInteger(maxParticipants);

  if (!start || !end || participants === null || participants < 1) {
    return NextResponse.json({ error: "Ungültige Kursdaten" }, { status: 400 });
  }

  const isQualified = await isTrainerQualifiedForCourse(trainerId, courseTypeId);
  if (!isQualified) {
    return NextResponse.json({ error: "Trainer ist für diese Kursart nicht qualifiziert" }, { status: 400 });
  }

  try {
    const course = await prisma.course.create({
      data: {
        courseTypeId,
        startTime: start,
        endTime: end,
        maxParticipants: participants,
        roomId,
        trainerId
      },
      include: {
        courseType: true,
        room: true,
        trainer: true
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Kurs konnte nicht erstellt werden" }, { status: 500 });
  }
}
