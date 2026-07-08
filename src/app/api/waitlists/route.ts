import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateWaitlistBody = {
  memberId?: string;
  courseId?: string;
  position?: unknown;
};

function parseInteger(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : Math.floor(parsed);
}

export async function GET() {
  const waitlists = await prisma.waitlist.findMany({
    include: {
      member: true,
      course: {
        include: { courseType: true, room: true, trainer: true }
      }
    },
    orderBy: [{ courseId: "asc" }, { position: "asc" }]
  });

  return NextResponse.json({ waitlists });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateWaitlistBody;
  const { memberId, courseId, position } = body;

  if (!memberId || !courseId) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const parsedPosition = parseInteger(position);
  if (parsedPosition === null || parsedPosition < 1) {
    return NextResponse.json({ error: "Ungültige Position" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } });
  if (!member) {
    return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) {
    return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
  }

  try {
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        memberId,
        courseId,
        position: parsedPosition
      },
      include: {
        member: true,
        course: { include: { courseType: true, room: true, trainer: true } }
      }
    });

    return NextResponse.json(waitlistEntry, { status: 201 });
  } catch (error) {
    const e = error as Prisma.PrismaClientKnownRequestError;
    if (e && e.code === "P2002") {
      return NextResponse.json({ error: "Wartelisteneintrag existiert bereits" }, { status: 409 });
    }

    return NextResponse.json({ error: "Wartelisteneintrag konnte nicht erstellt werden" }, { status: 500 });
  }
}
