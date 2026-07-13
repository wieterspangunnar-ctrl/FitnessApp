import test from "node:test";
import assert from "node:assert/strict";

import { prisma } from "@/lib/prisma";
import { GET } from "./route";

test("returns pending PT charge items for the month closing list", async () => {
  const original = {
    findMany: prisma.customerAccountEntry.findMany
  };

  let findManyArgs: Record<string, unknown> | null = null;

  prisma.customerAccountEntry.findMany = (async (args: Record<string, unknown>) => {
    findManyArgs = args;

    return [
      {
        id: "entry-1",
        amountCents: 7000,
        createdAt: new Date("2026-07-10T10:00:00.000Z"),
        member: {
          id: "member-1",
          firstName: "Mia",
          lastName: "Muster",
          email: "mia@example.com"
        },
        personalTrainingBooking: {
          id: "pt-1",
          startTime: new Date("2026-07-20T09:00:00.000Z"),
          endTime: new Date("2026-07-20T10:00:00.000Z"),
          trainer: {
            id: "trainer-1",
            firstName: "Tom",
            lastName: "Trainer"
          }
        }
      }
    ];
  }) as any;

  try {
    const response = await GET();

    assert.equal(response.status, 200);

    const payload = await response.json();

    assert.deepEqual(findManyArgs, {
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
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });

    assert.equal(payload.totalOpenItems, 1);
    assert.equal(payload.totalOpenAmountCents, 7000);
    assert.equal(payload.items[0]?.id, "entry-1");
  } finally {
    prisma.customerAccountEntry.findMany = original.findMany;
  }
});