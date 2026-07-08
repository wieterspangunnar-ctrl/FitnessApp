import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const member = await prisma.member.findFirst({
    include: {
      membershipTier: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ member });
}
