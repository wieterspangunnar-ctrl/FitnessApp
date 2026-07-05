import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultMembershipTiers } from "@/lib/member-seed";

export async function GET() {
  const tiers = await ensureDefaultMembershipTiers();
  const members = await prisma.member.findMany({
    include: {
      membershipTier: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ members, tiers });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, sepaIban, status, membershipTierId, contractEndDate } = body;

  if (!firstName || !lastName || !email || !sepaIban || !membershipTierId || !contractEndDate) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const tiers = await ensureDefaultMembershipTiers();
  const tierExists = tiers.some((tier) => tier.id === membershipTierId);

  if (!tierExists) {
    return NextResponse.json({ error: "Ungültiger Tarif" }, { status: 400 });
  }

  const member = await prisma.member.create({
    data: {
      firstName,
      lastName,
      email,
      sepaIban,
      status: status ?? "ACTIVE",
      membershipTierId,
      contractEndDate: new Date(contractEndDate)
    },
    include: {
      membershipTier: true
    }
  });

  return NextResponse.json(member, { status: 201 });
}
