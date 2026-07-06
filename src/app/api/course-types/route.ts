import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const courseTypes = await prisma.courseType.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ courseTypes });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  try {
    const ct = await prisma.courseType.create({ data: { name } });
    return NextResponse.json(ct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Kursart konnte nicht erstellt werden" }, { status: 500 });
  }
}
