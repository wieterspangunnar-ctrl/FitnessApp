import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  const courses = await prisma.course.findMany({
    include: {
      courseType: true,
      room: true,
      trainer: true
    },
    orderBy: { startTime: "asc" }
  });

  return NextResponse.json({ courses });
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
