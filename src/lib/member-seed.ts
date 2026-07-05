import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function ensureDefaultMembershipTiers() {
  const existingTiers = await prisma.membershipTier.findMany({
    orderBy: { name: "asc" }
  });

  if (existingTiers.length > 0) {
    return existingTiers;
  }

  const defaultTiers = [
    {
      name: "Basic",
      monthlyPrice: new Prisma.Decimal("79.00"),
      maxCoursesPerMonth: 5,
      hasVideoAccess: false,
      bookingWindowDays: 7,
      hasFreeLateCancellation: false,
      includedPtSlotsPerMonth: 0
    },
    {
      name: "Plus",
      monthlyPrice: new Prisma.Decimal("129.00"),
      maxCoursesPerMonth: 8,
      hasVideoAccess: true,
      bookingWindowDays: 10,
      hasFreeLateCancellation: false,
      includedPtSlotsPerMonth: 0
    },
    {
      name: "Premium",
      monthlyPrice: new Prisma.Decimal("189.00"),
      maxCoursesPerMonth: null,
      hasVideoAccess: true,
      bookingWindowDays: 14,
      hasFreeLateCancellation: true,
      includedPtSlotsPerMonth: 1
    }
  ];

  await prisma.$transaction(
    defaultTiers.map((tier) => prisma.membershipTier.create({ data: tier }))
  );

  return prisma.membershipTier.findMany({ orderBy: { name: "asc" } });
}
