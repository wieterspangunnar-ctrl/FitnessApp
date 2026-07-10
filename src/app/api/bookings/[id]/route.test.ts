import test from "node:test";
import assert from "node:assert/strict";

import { DELETE } from "./route";
import { prisma } from "@/lib/prisma";
import { notificationDispatcher } from "@/lib/notifications";
import type { WaitlistMoveUpNotificationPayload } from "@/lib/notifications";

test("triggers waitlist move-up notification after timely cancellation", async () => {
  const original = {
    bookingFindUnique: prisma.booking.findUnique,
    transaction: prisma.$transaction,
    sendWaitlistMoveUpNotification: notificationDispatcher.sendWaitlistMoveUpNotification
  };

  let notificationPayload: any = null;

  prisma.booking.findUnique = (async () => ({
    id: "booking-1",
    status: "CONFIRMED",
    member: {
      membershipTier: {
        hasFreeLateCancellation: false
      }
    },
    course: {
      id: "course-1",
      startTime: new Date(Date.now() + 3 * 60 * 60 * 1000)
    }
  })) as any;

  prisma.$transaction = (async (callback: (tx: any) => Promise<any>) => {
    return callback({
      booking: {
        update: async () => ({ id: "booking-1", status: "CANCELLED_TIMELY" }),
        create: async () => ({ id: "booking-promoted" })
      },
      waitlist: {
        findFirst: async () => ({
          id: "waitlist-1",
          memberId: "member-2",
          courseId: "course-1",
          member: {
            id: "member-2",
            email: "member2@example.com",
            firstName: "Max",
            lastName: "Muster"
          },
          course: {
            id: "course-1",
            startTime: new Date("2026-08-01T09:00:00.000Z"),
            courseType: { name: "Yoga" },
            room: { id: "room-1", name: "Saal 1" },
            trainer: { id: "trainer-1", firstName: "Tom", lastName: "Trainer", email: "tom@example.com", hourlyPtRate: 60 }
          }
        }),
        findUnique: async () => ({ id: "waitlist-1", courseId: "course-1" }),
        delete: async () => ({ id: "waitlist-1" }),
        findMany: async () => [],
        update: async () => ({ id: "ignore" })
      }
    });
  }) as any;

  notificationDispatcher.sendWaitlistMoveUpNotification = (async (payload: WaitlistMoveUpNotificationPayload) => {
    notificationPayload = payload;
  }) as any;

  try {
    const response = await DELETE(new Request("http://localhost/api/bookings/booking-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "booking-1" })
    });

    assert.equal(response.status, 200);
    assert.deepEqual(notificationPayload, {
      member: {
        id: "member-2",
        email: "member2@example.com",
        firstName: "Max",
        lastName: "Muster"
      },
      course: {
        id: "course-1",
        startTime: new Date("2026-08-01T09:00:00.000Z"),
        courseTypeName: "Yoga"
      }
    });
  } finally {
    prisma.booking.findUnique = original.bookingFindUnique;
    prisma.$transaction = original.transaction;
    notificationDispatcher.sendWaitlistMoveUpNotification = original.sendWaitlistMoveUpNotification;
  }
});
