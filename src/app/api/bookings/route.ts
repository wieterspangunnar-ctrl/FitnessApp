import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateBookingBody = {
  memberId?: string;
  courseId?: string;
};

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

  const member = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } });
  if (!member) {
    return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) {
    return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        memberId,
        courseId
      },
      include: {
        member: true,
        course: { include: { courseType: true, room: true, trainer: true } }
      }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    const e = error as Prisma.PrismaClientKnownRequestError;
    if (e && e.code === "P2002") {
      return NextResponse.json({ error: "Buchung existiert bereits" }, { status: 409 });
    }

    return NextResponse.json({ error: "Buchung konnte nicht erstellt werden" }, { status: 500 });
  }
}
