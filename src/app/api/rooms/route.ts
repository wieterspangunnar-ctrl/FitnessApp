import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  try {
    const room = await prisma.room.create({ data: { name } });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Raum konnte nicht erstellt werden" }, { status: 500 });
  }
}
