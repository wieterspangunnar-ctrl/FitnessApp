import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type UpdateCourseBody = {
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
