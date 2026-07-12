import test from "node:test";
import assert from "node:assert/strict";

import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";

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
