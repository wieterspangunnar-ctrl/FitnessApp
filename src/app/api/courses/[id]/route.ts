import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COURSE_STATUSES = ["SCHEDULED", "CANCELLED_TRAINER_SICKNESS"] as const;

type UpdateCourseBody = {
  courseTypeId?: string;
  startTime?: string;
  endTime?: string;
  maxParticipants?: unknown;
  roomId?: string;
  trainerId?: string;
  status?: string;
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as UpdateCourseBody;
  const data: Record<string, unknown> = {};

  if (body.courseTypeId !== undefined) data.courseTypeId = body.courseTypeId;
  if (body.startTime !== undefined) {
    const parsed = parseDateTime(body.startTime);
    if (!parsed) {
      return NextResponse.json({ error: "Ungültiges Startdatum" }, { status: 400 });
    }
    data.startTime = parsed;
  }
  if (body.endTime !== undefined) {
    const parsed = parseDateTime(body.endTime);
    if (!parsed) {
      return NextResponse.json({ error: "Ungültiges Enddatum" }, { status: 400 });
    }
    data.endTime = parsed;
  }
  if (body.maxParticipants !== undefined) {
    const parsed = parseInteger(body.maxParticipants);
    if (parsed === null || parsed < 1) {
      return NextResponse.json({ error: "Ungültige Teilnehmerzahl" }, { status: 400 });
    }
    data.maxParticipants = parsed;
  }
  if (body.roomId !== undefined) data.roomId = body.roomId;
  if (body.trainerId !== undefined) data.trainerId = body.trainerId;
  if (body.status !== undefined) {
    if (!COURSE_STATUSES.includes(body.status as (typeof COURSE_STATUSES)[number])) {
      return NextResponse.json({ error: "Ungültiger Kursstatus" }, { status: 400 });
    }

    data.status = body.status;
  }

  if (body.courseTypeId !== undefined || body.trainerId !== undefined) {
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { courseTypeId: true, trainerId: true }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
    }

    const effectiveCourseTypeId = body.courseTypeId ?? existingCourse.courseTypeId;
    const effectiveTrainerId = body.trainerId ?? existingCourse.trainerId;

    const isQualified = await isTrainerQualifiedForCourse(effectiveTrainerId, effectiveCourseTypeId);
    if (!isQualified) {
      return NextResponse.json({ error: "Trainer ist für diese Kursart nicht qualifiziert" }, { status: 400 });
    }
  }

  try {
    const course = await prisma.course.update({
      where: { id },
      data,
      include: {
        courseType: true,
        room: true,
        trainer: true
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ error: "Kurs konnte nicht aktualisiert werden" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Kurs konnte nicht gelöscht werden" }, { status: 500 });
  }
}
