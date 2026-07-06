import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: { membershipTier: true }
  });

  if (!member) {
    return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(member);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, email, sepaIban, status, membershipTierId, contractEndDate } = body;

  if (!firstName || !lastName || !email || !sepaIban || !membershipTierId || !contractEndDate) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const member = await prisma.member.update({
    where: { id },
    data: {
      firstName,
      lastName,
      email,
      sepaIban,
      status,
      membershipTierId,
      contractEndDate: new Date(contractEndDate)
    },
    include: { membershipTier: true }
  });

  return NextResponse.json(member);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
