import test from "node:test";
import assert from "node:assert/strict";

import { prisma } from "@/lib/prisma";
import { GET, POST } from "./route";

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

test("marks pending PT month closing items as billed to account", async () => {
  const original = {
    findMany: prisma.customerAccountEntry.findMany,
    transaction: prisma.$transaction
  };

  let findManyCalls = 0;
  let accountEntryUpdateArgs: Record<string, unknown> | null = null;
  let ptBookingUpdateArgs: Record<string, unknown> | null = null;

  prisma.customerAccountEntry.findMany = (async () => {
    findManyCalls += 1;

    if (findManyCalls === 1) {
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
    }

    return [];
  }) as any;

  prisma.$transaction = (async (callback: (tx: any) => Promise<any>) => {
    return callback({
      customerAccountEntry: {
        updateMany: async (args: Record<string, unknown>) => {
          accountEntryUpdateArgs = args;
          return { count: 1 };
        }
      },
      personalTrainingBooking: {
        updateMany: async (args: Record<string, unknown>) => {
          ptBookingUpdateArgs = args;
          return { count: 1 };
        }
      }
    });
  }) as any;

  try {
    const response = await POST();
    assert.equal(response.status, 200);

    const payload = await response.json();

    assert.deepEqual(accountEntryUpdateArgs, {
      where: {
        id: { in: ["entry-1"] },
        type: "PERSONAL_TRAINING_CHARGE",
        billingStatus: "PENDING"
      },
      data: {
        billingStatus: "BILLED_TO_ACCOUNT",
        billedAt: new Date(payload.processedAt)
      }
    });

    assert.deepEqual(ptBookingUpdateArgs, {
      where: {
        id: { in: ["pt-1"] },
        billingStatus: "PENDING"
      },
      data: {
        billingStatus: "BILLED_TO_ACCOUNT"
      }
    });

    assert.equal(payload.updatedAccountEntries, 1);
    assert.equal(payload.updatedPersonalTrainingBookings, 1);
    assert.equal(typeof payload.processedAt, "string");
  } finally {
    prisma.customerAccountEntry.findMany = original.findMany;
    prisma.$transaction = original.transaction;
  }
});

test("returns zero updates when no pending PT month closing items exist", async () => {
  const original = {
    findMany: prisma.customerAccountEntry.findMany,
    transaction: prisma.$transaction
  };

  prisma.customerAccountEntry.findMany = (async () => []) as any;

  let transactionCalled = false;
  prisma.$transaction = (async () => {
    transactionCalled = true;
    return null;
  }) as any;

  try {
    const response = await POST();
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.updatedAccountEntries, 0);
    assert.equal(payload.updatedPersonalTrainingBookings, 0);
    assert.equal(typeof payload.processedAt, "string");
    assert.equal(transactionCalled, false);
  } finally {
    prisma.customerAccountEntry.findMany = original.findMany;
    prisma.$transaction = original.transaction;
  }
});