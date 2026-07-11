import test from "node:test";
import assert from "node:assert/strict";

import { PUT } from "./route";
import { prisma } from "@/lib/prisma";

test("updates course status to trainer sickness cancellation", async () => {
  const originalCourseUpdate = prisma.course.update;

  prisma.course.update = (async ({ where, data }: { where: { id: string }; data: { status: string } }) => ({
    id: where.id,
    status: data.status,
    startTime: new Date("2026-08-01T09:00:00.000Z"),
    endTime: new Date("2026-08-01T10:00:00.000Z"),
    maxParticipants: 12,
    courseTypeId: "type-1",
    roomId: "room-1",
    trainerId: "trainer-1",
    courseType: { id: "type-1", name: "Yoga" },
    room: { id: "room-1", name: "Saal 1" },
    trainer: {
      id: "trainer-1",
      firstName: "Tom",
      lastName: "Trainer",
      email: "tom@example.com",
      hourlyPtRate: 60
    }
  })) as any;

  try {
    const response = await PUT(
      new Request("http://localhost/api/courses/course-1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED_TRAINER_SICKNESS" })
      }),
      { params: Promise.resolve({ id: "course-1" }) }
    );

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.status, "CANCELLED_TRAINER_SICKNESS");
  } finally {
    prisma.course.update = originalCourseUpdate;
  }
});

test("rejects invalid course status updates", async () => {
  const response = await PUT(
    new Request("http://localhost/api/courses/course-1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "INVALID" })
    }),
    { params: Promise.resolve({ id: "course-1" }) }
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "Ungültiger Kursstatus");
});
