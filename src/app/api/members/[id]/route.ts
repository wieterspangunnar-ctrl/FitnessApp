import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, email, sepaIban, status, membershipTierId, contractEndDate } = body;

  const member = await prisma.member.update({
    where: { id },
    data: {
      firstName,
      lastName,
      email,
      sepaIban,
      status,
      membershipTierId,
      contractEndDate: contractEndDate ? new Date(contractEndDate) : undefined
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
