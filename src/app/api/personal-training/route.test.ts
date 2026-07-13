import test from "node:test";
import assert from "node:assert/strict";

import { GET, POST } from "./route";
import { PUT } from "./[id]/route";
import { prisma } from "@/lib/prisma";
import {
  getIncludedPremiumPtSlotMonthWindow,
  qualifiesForIncludedPremiumPtSlot
} from "@/lib/premium-pt-slot";

function createRouteContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

test("returns only available upcoming slots when onlyAvailable=true", async () => {
  const original = {
    personalTrainingBookingFindMany: prisma.personalTrainingBooking.findMany
  };

  let findManyArgs: Record<string, unknown> | null = null;

  prisma.personalTrainingBooking.findMany = (async (args: Record<string, unknown>) => {
    findManyArgs = args;
    return [];
  }) as any;

  try {
    const response = await GET(new Request("http://localhost/api/personal-training?onlyAvailable=true"));
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.deepEqual(payload, { slots: [] });

    const where = (findManyArgs?.["where"] ?? null) as Record<string, unknown> | null;
    const orderBy = (findManyArgs?.["orderBy"] ?? null) as Record<string, unknown> | null;

    assert.equal(where?.status, "AVAILABLE");
    assert.ok(where?.startTime);
    assert.equal(orderBy?.startTime, "asc");
  } finally {
    prisma.personalTrainingBooking.findMany = original.personalTrainingBookingFindMany;
  }
});

test("creates personal training slots as AVAILABLE", async () => {
  const original = {
    trainerFindUnique: prisma.trainer.findUnique,
    personalTrainingBookingFindFirst: prisma.personalTrainingBooking.findFirst,
    personalTrainingBookingCreate: prisma.personalTrainingBooking.create
  };

  let createdData: Record<string, unknown> | null = null;

  prisma.trainer.findUnique = (async () => ({
    id: "trainer-1",
    firstName: "Tom",
    lastName: "Trainer",
    email: "tom@example.com",
    hourlyPtRate: 70
  })) as any;

  prisma.personalTrainingBooking.findFirst = (async () => null) as any;

  prisma.personalTrainingBooking.create = (async ({ data }: { data: Record<string, unknown> }) => {
    createdData = data;

    return {
      id: "pt-slot-1",
      trainerId: data.trainerId,
      memberId: null,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
      isFreePremiumSlot: false,
      billingStatus: data.billingStatus,
      trainer: {
        id: "trainer-1",
        firstName: "Tom",
        lastName: "Trainer"
      }
    };
  }) as any;

  const startTime = "2026-07-15T09:00:00.000Z";
  const endTime = "2026-07-15T10:00:00.000Z";

  try {
    const response = await POST(
      new Request("http://localhost/api/personal-training", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          trainerId: "trainer-1",
          startTime,
          endTime
        })
      })
    );

    assert.equal(response.status, 201);

    const payload = await response.json();
    assert.equal(payload.status, "AVAILABLE");
    assert.equal(payload.memberId, null);

    assert.deepEqual(createdData, {
      trainerId: "trainer-1",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "AVAILABLE",
      billingStatus: "PENDING"
    });
  } finally {
    prisma.trainer.findUnique = original.trainerFindUnique;
    prisma.personalTrainingBooking.findFirst = original.personalTrainingBookingFindFirst;
    prisma.personalTrainingBooking.create = original.personalTrainingBookingCreate;
  }
});

test("rejects overlapping slots for the same trainer", async () => {
  const original = {
    trainerFindUnique: prisma.trainer.findUnique,
    personalTrainingBookingFindFirst: prisma.personalTrainingBooking.findFirst
  };

  prisma.trainer.findUnique = (async () => ({
    id: "trainer-1",
    firstName: "Tom",
    lastName: "Trainer",
    email: "tom@example.com",
    hourlyPtRate: 70
  })) as any;

  prisma.personalTrainingBooking.findFirst = (async () => ({
    id: "pt-slot-existing"
  })) as any;

  try {
    const response = await POST(
      new Request("http://localhost/api/personal-training", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          trainerId: "trainer-1",
          startTime: "2026-07-15T09:30:00.000Z",
          endTime: "2026-07-15T10:30:00.000Z"
        })
      })
    );

    assert.equal(response.status, 409);

    const payload = await response.json();
    assert.equal(payload.error, "Zeitslot überschneidet sich mit einem bestehenden Termin des Trainers");
  } finally {
    prisma.trainer.findUnique = original.trainerFindUnique;
    prisma.personalTrainingBooking.findFirst = original.personalTrainingBookingFindFirst;
  }
});

test("books an available PT slot directly for an active member", async () => {
  const original = {
    personalTrainingBookingFindUnique: prisma.personalTrainingBooking.findUnique,
    memberFindUnique: prisma.member.findUnique,
    personalTrainingBookingCount: prisma.personalTrainingBooking.count,
    transaction: prisma.$transaction
  };

  let updateManyArgs: Record<string, unknown> | null = null;
  let accountEntryUpsertCalled = false;
  let countArgs: Record<string, unknown> | null = null;
  let findUniqueCalls = 0;

  prisma.personalTrainingBooking.findUnique = (async () => {
    findUniqueCalls += 1;

    if (findUniqueCalls === 1) {
      return {
        id: "pt-slot-1",
        trainerId: "trainer-1",
        memberId: null,
        startTime: new Date("2026-08-01T09:00:00.000Z"),
        endTime: new Date("2026-08-01T10:00:00.000Z"),
        status: "AVAILABLE",
        billingStatus: "PENDING",
        isFreePremiumSlot: false,
        trainer: {
          hourlyPtRate: 70
        }
      };
    }

    return {
      id: "pt-slot-1",
      startTime: new Date("2026-08-01T09:00:00.000Z"),
      endTime: new Date("2026-08-01T10:00:00.000Z"),
      trainer: { id: "trainer-1", firstName: "Tom", lastName: "Trainer", email: "tom@example.com" },
      member: { id: "member-1", firstName: "Lisa", lastName: "Mitglied" },
      status: "BOOKED"
    };
  }) as any;

  prisma.member.findUnique = (async () => ({
    id: "member-1",
    status: "ACTIVE",
    membershipTier: {
      includedPtSlotsPerMonth: 1
    }
  })) as any;

  prisma.personalTrainingBooking.count = (async (args: Record<string, unknown>) => {
    countArgs = args;
    return 0;
  }) as any;

  prisma.$transaction = (async (callback: (tx: any) => Promise<any>) => {
    return callback({
      personalTrainingBooking: {
        updateMany: async (args: Record<string, unknown>) => {
          updateManyArgs = args;
          return { count: 1 };
        }
      },
      customerAccountEntry: {
        upsert: async () => {
          accountEntryUpsertCalled = true;
          return { id: "account-entry-should-not-exist" };
        }
      }
    });
  }) as any;

  try {
    const response = await PUT(
      new Request("http://localhost/api/personal-training/pt-slot-1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: "member-1" })
      }),
      createRouteContext("pt-slot-1")
    );

    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.status, "BOOKED");
    assert.equal(payload.member.id, "member-1");
    assert.deepEqual(payload.premiumPtSlotRecognition, {
      qualifiesForFreePremiumSlot: true,
      includedPtSlotsPerMonth: 1,
      alreadyUsedIncludedSlotsThisMonth: 0
    });
    assert.deepEqual(countArgs, {
      where: {
        memberId: "member-1",
        isFreePremiumSlot: true,
        status: { in: ["BOOKED", "COMPLETED"] },
        startTime: {
          gte: new Date("2026-08-01T00:00:00.000Z"),
          lt: new Date("2026-09-01T00:00:00.000Z")
        }
      }
    });
    assert.deepEqual(updateManyArgs, {
      where: {
        id: "pt-slot-1",
        status: "AVAILABLE",
        memberId: null
      },
      data: {
        memberId: "member-1",
        status: "BOOKED",
        isFreePremiumSlot: true,
        billingStatus: "PAID"
      }
    });
    assert.equal(accountEntryUpsertCalled, false);
  } finally {
    prisma.personalTrainingBooking.findUnique = original.personalTrainingBookingFindUnique;
    prisma.member.findUnique = original.memberFindUnique;
    prisma.personalTrainingBooking.count = original.personalTrainingBookingCount;
    prisma.$transaction = original.transaction;
  }
});

test("recognizes when the monthly included premium PT slot is already used", async () => {
  const original = {
    personalTrainingBookingFindUnique: prisma.personalTrainingBooking.findUnique,
    memberFindUnique: prisma.member.findUnique,
    personalTrainingBookingCount: prisma.personalTrainingBooking.count,
    transaction: prisma.$transaction
  };

  let updateManyArgs: Record<string, unknown> | null = null;
  let accountEntryUpsertArgs: Record<string, unknown> | null = null;
  let findUniqueCalls = 0;

  prisma.personalTrainingBooking.findUnique = (async () => {
    findUniqueCalls += 1;

    if (findUniqueCalls === 1) {
      return {
        id: "pt-slot-august-2",
        trainerId: "trainer-1",
        memberId: null,
        startTime: new Date("2026-08-20T09:00:00.000Z"),
        endTime: new Date("2026-08-20T10:00:00.000Z"),
        status: "AVAILABLE",
        billingStatus: "PENDING",
        isFreePremiumSlot: false,
        trainer: {
          hourlyPtRate: 79.5
        }
      };
    }

    return {
      id: "pt-slot-august-2",
      startTime: new Date("2026-08-20T09:00:00.000Z"),
      endTime: new Date("2026-08-20T10:00:00.000Z"),
      trainer: { id: "trainer-1", firstName: "Tom", lastName: "Trainer", email: "tom@example.com" },
      member: { id: "member-1", firstName: "Lisa", lastName: "Mitglied" },
      status: "BOOKED"
    };
  }) as any;

  prisma.member.findUnique = (async () => ({
    id: "member-1",
    status: "ACTIVE",
    membershipTier: {
      includedPtSlotsPerMonth: 1
    }
  })) as any;

  prisma.personalTrainingBooking.count = (async () => 1) as any;
  prisma.$transaction = (async (callback: (tx: any) => Promise<any>) => {
    return callback({
      personalTrainingBooking: {
        updateMany: async (args: Record<string, unknown>) => {
          updateManyArgs = args;
          return { count: 1 };
        }
      },
      customerAccountEntry: {
        upsert: async (args: Record<string, unknown>) => {
          accountEntryUpsertArgs = args;
          return {
            id: "account-entry-pt-1",
            type: "PERSONAL_TRAINING_CHARGE",
            amountCents: 7950,
            billingStatus: "PENDING"
          };
        }
      }
    });
  }) as any;

  try {
    const response = await PUT(
      new Request("http://localhost/api/personal-training/pt-slot-august-2", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: "member-1" })
      }),
      createRouteContext("pt-slot-august-2")
    );

    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.deepEqual(payload.premiumPtSlotRecognition, {
      qualifiesForFreePremiumSlot: false,
      includedPtSlotsPerMonth: 1,
      alreadyUsedIncludedSlotsThisMonth: 1
    });
    assert.deepEqual(updateManyArgs, {
      where: {
        id: "pt-slot-august-2",
        status: "AVAILABLE",
        memberId: null
      },
      data: {
        memberId: "member-1",
        status: "BOOKED",
        isFreePremiumSlot: false,
        billingStatus: "PENDING"
      }
    });
    assert.deepEqual(accountEntryUpsertArgs, {
      where: {
        personalTrainingBookingId_type: {
          personalTrainingBookingId: "pt-slot-august-2",
          type: "PERSONAL_TRAINING_CHARGE"
        }
      },
      create: {
        memberId: "member-1",
        personalTrainingBookingId: "pt-slot-august-2",
        type: "PERSONAL_TRAINING_CHARGE",
        amountCents: 7950,
        billingStatus: "PENDING",
        description: "Kostenpflichtiger Personal-Training-Slot"
      },
      update: {
        memberId: "member-1",
        amountCents: 7950,
        billingStatus: "PENDING",
        billedAt: null,
        paidAt: null,
        description: "Kostenpflichtiger Personal-Training-Slot"
      }
    });
  } finally {
    prisma.personalTrainingBooking.findUnique = original.personalTrainingBookingFindUnique;
    prisma.member.findUnique = original.memberFindUnique;
    prisma.personalTrainingBooking.count = original.personalTrainingBookingCount;
    prisma.$transaction = original.transaction;
  }
});

test("qualifies for an included premium PT slot only while monthly quota remains", () => {
  assert.equal(
    qualifiesForIncludedPremiumPtSlot({ includedPtSlotsPerMonth: 1, alreadyUsedIncludedSlotsThisMonth: 0 }),
    true
  );
  assert.equal(
    qualifiesForIncludedPremiumPtSlot({ includedPtSlotsPerMonth: 1, alreadyUsedIncludedSlotsThisMonth: 1 }),
    false
  );
  assert.equal(
    qualifiesForIncludedPremiumPtSlot({ includedPtSlotsPerMonth: 0, alreadyUsedIncludedSlotsThisMonth: 0 }),
    false
  );
});

test("derives the included premium PT slot month from the slot start time in UTC", () => {
  assert.deepEqual(
    getIncludedPremiumPtSlotMonthWindow(new Date("2026-08-20T09:00:00.000Z")),
    {
      startOfMonth: new Date("2026-08-01T00:00:00.000Z"),
      startOfNextMonth: new Date("2026-09-01T00:00:00.000Z")
    }
  );
});

test("rejects PT booking for inactive members", async () => {
  const original = {
    personalTrainingBookingFindUnique: prisma.personalTrainingBooking.findUnique,
    memberFindUnique: prisma.member.findUnique
  };

  prisma.personalTrainingBooking.findUnique = (async () => ({
    id: "pt-slot-1",
    trainerId: "trainer-1",
    memberId: null,
    startTime: new Date("2026-08-01T09:00:00.000Z"),
    endTime: new Date("2026-08-01T10:00:00.000Z"),
    status: "AVAILABLE",
    billingStatus: "PENDING",
    isFreePremiumSlot: false
  })) as any;

  prisma.member.findUnique = (async () => ({
    id: "member-1",
    status: "PAUSED"
  })) as any;

  try {
    const response = await PUT(
      new Request("http://localhost/api/personal-training/pt-slot-1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: "member-1" })
      }),
      createRouteContext("pt-slot-1")
    );

    assert.equal(response.status, 403);

    const payload = await response.json();
    assert.equal(payload.error, "Mitglied nicht aktiv");
  } finally {
    prisma.personalTrainingBooking.findUnique = original.personalTrainingBookingFindUnique;
    prisma.member.findUnique = original.memberFindUnique;
  }
});

test("rejects trainer cancellation if slot starts in less than 24 hours", async () => {
  const original = {
    personalTrainingBookingFindUnique: prisma.personalTrainingBooking.findUnique,
    personalTrainingBookingUpdate: prisma.personalTrainingBooking.update
  };

  let updateCalled = false;

  prisma.personalTrainingBooking.findUnique = (async () => ({
    id: "pt-slot-1",
    trainerId: "trainer-1",
    memberId: "member-1",
    startTime: new Date(Date.now() + 23 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: "BOOKED",
    billingStatus: "PENDING",
    isFreePremiumSlot: false
  })) as any;

  prisma.personalTrainingBooking.update = (async () => {
    updateCalled = true;
    return {};
  }) as any;

  try {
    const response = await PUT(
      new Request("http://localhost/api/personal-training/pt-slot-1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED_BY_TRAINER" })
      }),
      createRouteContext("pt-slot-1")
    );

    assert.equal(response.status, 409);
    const payload = await response.json();
    assert.equal(payload.error, "Trainerabsage ist nur bis mindestens 24 Stunden vor Slotbeginn erlaubt");
    assert.equal(updateCalled, false);
  } finally {
    prisma.personalTrainingBooking.findUnique = original.personalTrainingBookingFindUnique;
    prisma.personalTrainingBooking.update = original.personalTrainingBookingUpdate;
  }
});

test("allows trainer cancellation if slot starts in at least 24 hours", async () => {
  const original = {
    personalTrainingBookingFindUnique: prisma.personalTrainingBooking.findUnique,
    personalTrainingBookingUpdate: prisma.personalTrainingBooking.update
  };

  let updateArgs: Record<string, unknown> | null = null;

  prisma.personalTrainingBooking.findUnique = (async () => ({
    id: "pt-slot-2",
    trainerId: "trainer-1",
    memberId: "member-1",
    startTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 27 * 60 * 60 * 1000),
    status: "BOOKED",
    billingStatus: "PENDING",
    isFreePremiumSlot: false
  })) as any;

  prisma.personalTrainingBooking.update = (async (args: Record<string, unknown>) => {
    updateArgs = args;
    return {
      id: "pt-slot-2",
      status: "CANCELLED_BY_TRAINER",
      trainer: { id: "trainer-1", firstName: "Tom", lastName: "Trainer" },
      member: { id: "member-1", firstName: "Lisa", lastName: "Mitglied" }
    };
  }) as any;

  try {
    const response = await PUT(
      new Request("http://localhost/api/personal-training/pt-slot-2", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED_BY_TRAINER" })
      }),
      createRouteContext("pt-slot-2")
    );

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.status, "CANCELLED_BY_TRAINER");
    assert.deepEqual(updateArgs, {
      where: { id: "pt-slot-2" },
      data: { status: "CANCELLED_BY_TRAINER" },
      include: {
        trainer: { select: { id: true, firstName: true, lastName: true } },
        member: { select: { id: true, firstName: true, lastName: true } }
      }
    });
  } finally {
    prisma.personalTrainingBooking.findUnique = original.personalTrainingBookingFindUnique;
    prisma.personalTrainingBooking.update = original.personalTrainingBookingUpdate;
  }
});
