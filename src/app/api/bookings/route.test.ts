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
    waitlistFindFirst: prisma.waitlist.findFirst,
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
        findFirst: async () => ({ position: 2 }),
        create: async ({ data }: { data: { memberId: string; courseId: string; position: number } }) => {
          createdWaitlistData = data;

          return {
            id: "waitlist-1",
            ...data,
            createdAt: new Date(),
            member: { id: "member-1" },
            course: { id: "course-1" }
          };
        }
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
      position: 3
    });
  } finally {
    prisma.member.findUnique = original.memberFindUnique;
    prisma.course.findUnique = original.courseFindUnique;
    prisma.booking.count = original.bookingCount;
    prisma.booking.findFirst = original.bookingFindFirst;
    prisma.waitlist.findFirst = original.waitlistFindFirst;
    prisma.waitlist.create = original.waitlistCreate;
    prisma.$transaction = original.transaction;
  }
});