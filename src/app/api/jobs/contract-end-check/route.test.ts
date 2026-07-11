import test from "node:test";
import assert from "node:assert/strict";

import { GET, contractEndCheckDependencies } from "./route";
import { prisma } from "@/lib/prisma";

test("returns members due for 14-day and 3-day contract-end checks", async () => {
  const original = {
    memberFindMany: prisma.member.findMany,
    dateNow: Date.now,
    sendContractEndReminderNotification: contractEndCheckDependencies.sendContractEndReminderNotification
  };
  const sentMemberIds: string[] = [];

  Date.now = () => new Date("2026-07-11T09:00:00.000Z").getTime();

  contractEndCheckDependencies.sendContractEndReminderNotification = (async (payload) => {
    sentMemberIds.push(payload.member.id);
  }) as typeof contractEndCheckDependencies.sendContractEndReminderNotification;

  prisma.member.findMany = (async () => [
    {
      id: "member-14",
      email: "m14@example.com",
      firstName: "Max",
      lastName: "Vierzehn",
      contractEndDate: new Date("2026-07-25T00:00:00.000Z")
    },
    {
      id: "member-3",
      email: "m3@example.com",
      firstName: "Mia",
      lastName: "Drei",
      contractEndDate: new Date("2026-07-14T23:00:00.000Z")
    },
    {
      id: "member-other",
      email: "other@example.com",
      firstName: "Oli",
      lastName: "Anders",
      contractEndDate: new Date("2026-07-20T00:00:00.000Z")
    }
  ]) as any;

  try {
    const response = await GET(new Request("http://localhost/api/jobs/contract-end-check"));
    assert.equal(response.status, 200);

    const payload = await response.json();

    assert.equal(payload.dueIn14DaysCount, 1);
    assert.equal(payload.dueIn3DaysCount, 1);
    assert.equal(payload.dueIn14Days[0].id, "member-14");
    assert.equal(payload.dueIn14Days[0].daysUntilEnd, 14);
    assert.equal(payload.dueIn3Days[0].id, "member-3");
    assert.equal(payload.dueIn3Days[0].daysUntilEnd, 3);
    assert.equal(payload.sentIn14DaysCount, 1);
    assert.equal(payload.sentIn3DaysCount, 1);
    assert.deepEqual(sentMemberIds.sort(), ["member-14", "member-3"].sort());
  } finally {
    prisma.member.findMany = original.memberFindMany;
    Date.now = original.dateNow;
    contractEndCheckDependencies.sendContractEndReminderNotification = original.sendContractEndReminderNotification;
  }
});

test("requires cron secret when CRON_SECRET is set", async () => {
  const originalCronSecret = process.env.CRON_SECRET;

  process.env.CRON_SECRET = "super-secret";

  try {
    const response = await GET(new Request("http://localhost/api/jobs/contract-end-check"));
    assert.equal(response.status, 401);

    const payload = await response.json();
    assert.equal(payload.error, "Nicht autorisiert");
  } finally {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  }
});