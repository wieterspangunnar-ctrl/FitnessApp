import { prisma } from "@/lib/prisma";

export type OpenPersonalTrainingChargeItem = {
  id: string;
  amountCents: number;
  createdAt: Date;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  personalTrainingBooking: {
    id: string;
    startTime: Date;
    endTime: Date;
    trainer: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
};

export type OpenPersonalTrainingChargesDashboardData = {
  items: OpenPersonalTrainingChargeItem[];
  totalOpenItems: number;
  totalOpenAmountCents: number;
};

export async function getOpenPersonalTrainingChargesDashboardData(): Promise<OpenPersonalTrainingChargesDashboardData> {
  const items = await prisma.customerAccountEntry.findMany({
    where: {
      type: "PERSONAL_TRAINING_CHARGE",
      billingStatus: "PENDING"
    },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      personalTrainingBooking: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          trainer: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    },
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" }
    ]
  });

  const totalOpenAmountCents = items.reduce((sum, item) => sum + item.amountCents, 0);

  return {
    items,
    totalOpenItems: items.length,
    totalOpenAmountCents
  };
}