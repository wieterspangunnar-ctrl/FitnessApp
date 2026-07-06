import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET() {
  const trainerQualifications = await prisma.trainerQualification.findMany({
    include: {
      trainer: true,
      courseType: true
    },
    orderBy: [
      { trainer: { lastName: "asc" } },
      { courseType: { name: "asc" } }
    ]
  });

  return NextResponse.json({ trainerQualifications });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { trainerId, courseTypeId } = body;

  if (!trainerId || !courseTypeId) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  try {
    const qualification = await prisma.trainerQualification.create({
      data: {
        trainerId,
        courseTypeId
      }
    });
    return NextResponse.json(qualification, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Diese Zuordnung existiert bereits" }, { status: 400 });
    }
    return NextResponse.json({ error: "Trainerqualifikation konnte nicht erstellt werden" }, { status: 500 });
  }
}
