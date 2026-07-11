import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "./route";
import { prisma } from "@/lib/prisma";

test("places members on the waitlist when the course is full", async () => {
  const original = {
    memberFindUnique: prisma.member.findUnique,
    courseFindUnique: prisma.course.findUnique,
    bookingCount: prisma.booking.count,
    bookingFindFirst: prisma.booking.findFirst,
    waitlistFindMany: prisma.waitlist.findMany,
    waitlistFindUniqueOrThrow: prisma.waitlist.findUniqueOrThrow,
    waitlistUpdate: prisma.waitlist.update,
    waitlistCreate: prisma.waitlist.create,
    transaction: prisma.$transaction
  };

  const futureStartTime = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  let createdWaitlistData: {
    memberId: string;
    courseId: string;
    position: number;
  } | null = null;

  prisma.member.findUnique = (async () => ({
    id: "member-1",
    status: "ACTIVE",
    membershipTier: {
      bookingWindowDays: 14,
      maxCoursesPerMonth: null
    }
  })) as any;

  prisma.course.findUnique = (async () => ({
    id: "course-1",
    startTime: futureStartTime,
    maxParticipants: 2
  })) as any;

  prisma.$transaction = (async (callback: (tx: any) => Promise<any>) => {
    return callback({
      booking: {
        count: async () => 2,
        findFirst: async () => null,
        create: async () => {
          throw new Error("booking.create should not be called when the course is full");
        }
      },
      waitlist: {
        findMany: async () => [
          {
            id: "waitlist-existing-1",
            position: 1,
            createdAt: new Date("2026-01-01T10:00:00.000Z")
          },
          {
            id: "waitlist-existing-2",
            position: 2,
            createdAt: new Date("2026-01-01T10:05:00.000Z")
          }
        ],
        update: async () => ({ id: "ignored" }),
        create: async ({ data }: { data: { memberId: string; courseId: string; position: number } }) => {
          createdWaitlistData = data;

          return {
            id: "waitlist-1",
            ...data,
            createdAt: new Date(),
            member: { id: "member-1" },
            course: { id: "course-1" }
          };
        },
        findUniqueOrThrow: async () => ({
          id: "waitlist-1",
          memberId: "member-1",
          courseId: "course-1",
          position: 3,
          createdAt: new Date(),
          member: { id: "member-1" },
          course: { id: "course-1" }
        })
      }
    });
  }) as any;

  try {
    const response = await POST(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: "member-1", courseId: "course-1" })
      })
    );

    assert.equal(response.status, 201);

    const payload = await response.json();
    assert.equal(payload.position, 3);
    assert.deepEqual(createdWaitlistData, {
      memberId: "member-1",
      courseId: "course-1",
      position: 100003
    });
  } finally {
    prisma.member.findUnique = original.memberFindUnique;
    prisma.course.findUnique = original.courseFindUnique;
    prisma.booking.count = original.bookingCount;
    prisma.booking.findFirst = original.bookingFindFirst;
    prisma.waitlist.findMany = original.waitlistFindMany;
    prisma.waitlist.findUniqueOrThrow = original.waitlistFindUniqueOrThrow;
    prisma.waitlist.update = original.waitlistUpdate;
    prisma.waitlist.create = original.waitlistCreate;
    prisma.$transaction = original.transaction;
  }
});

test("rejects bookings for courses cancelled due to trainer sickness", async () => {
  const originalMemberFindUnique = prisma.member.findUnique;
  const originalCourseFindUnique = prisma.course.findUnique;

  const futureStartTime = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  prisma.member.findUnique = (async () => ({
    id: "member-1",
    status: "ACTIVE",
    membershipTier: {
      bookingWindowDays: 14,
      maxCoursesPerMonth: null
    }
  })) as any;

  prisma.course.findUnique = (async () => ({
    id: "course-1",
    startTime: futureStartTime,
    status: "CANCELLED_TRAINER_SICKNESS"
  })) as any;

  try {
    const response = await POST(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: "member-1", courseId: "course-1" })
      })
    );

    assert.equal(response.status, 409);
    const payload = await response.json();
    assert.equal(payload.error, "Kurs wurde wegen Trainerausfall abgesagt");
  } finally {
    prisma.member.findUnique = originalMemberFindUnique;
    prisma.course.findUnique = originalCourseFindUnique;
  }
});