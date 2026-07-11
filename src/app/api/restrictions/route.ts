import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const restrictions = await prisma.noShowRestriction.findMany({
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { expiresAt: "asc" }
    });

    // Filtere nur aktive Sperren
    const activeRestrictions = restrictions.filter((r) => r.expiresAt > new Date());

    return NextResponse.json({ restrictions: activeRestrictions });
  } catch (error) {
    return NextResponse.json({ error: "Sperren konnten nicht abgerufen werden" }, { status: 500 });
  }
}
