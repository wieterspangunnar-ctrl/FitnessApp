import test from "node:test";
import assert from "node:assert/strict";

import { DELETE, PUT } from "./route";
import { prisma } from "@/lib/prisma";
import { notificationDispatcher } from "@/lib/notifications";
import type { WaitlistMoveUpNotificationPayload } from "@/lib/notifications";

test("updates booking status for admin control", async () => {
  const originalBookingFindUnique = prisma.booking.findUnique;
  const originalBookingUpdate = prisma.booking.update;

  prisma.booking.findUnique = (async () => ({
    status: "CONFIRMED",
    course: {
      startTime: new Date(Date.now() - 60 * 60 * 1000)
    }
  })) as any;

  prisma.booking.update = (async ({ where, data }: { where: { id: string }; data: { status: string } }) => ({
    id: where.id,
    status: data.status,
    bookedAt: new Date("2026-01-01T08:00:00.000Z"),
    member: {
      id: "member-1",
      firstName: "Max",
      lastName: "Muster",
      email: "max@example.com",
      sepaIban: "DE02120300000000202051",
      status: "ACTIVE",
      membershipTierId: "tier-1",
      contractEndDate: new Date("2027-01-01T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z")
    },
    course: {
      id: "course-1",
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
    }
  })) as any;

  try {
    const response = await PUT(
      new Request("http://localhost/api/bookings/booking-1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "NO_SHOW" })
      }),
      { params: Promise.resolve({ id: "booking-1" }) }
    );

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.status, "NO_SHOW");
  } finally {
    prisma.booking.findUnique = originalBookingFindUnique;
    prisma.booking.update = originalBookingUpdate;
  }
});

test("rejects NO_SHOW for non-confirmed bookings", async () => {
  const originalBookingFindUnique = prisma.booking.findUnique;

  prisma.booking.findUnique = (async () => ({
    status: "CANCELLED_TIMELY",
    course: {
      startTime: new Date(Date.now() - 60 * 60 * 1000)
    }
  })) as any;

  try {
    const response = await PUT(
      new Request("http://localhost/api/bookings/booking-1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "NO_SHOW" })
      }),
      { params: Promise.resolve({ id: "booking-1" }) }
    );

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.error, "NO_SHOW kann nur fuer bestaetigte Buchungen gesetzt werden");
  } finally {
    prisma.booking.findUnique = originalBookingFindUnique;
  }
});

test("rejects NO_SHOW before course start", async () => {
  const originalBookingFindUnique = prisma.booking.findUnique;

  prisma.booking.findUnique = (async () => ({
    status: "CONFIRMED",
    course: {
      startTime: new Date(Date.now() + 60 * 60 * 1000)
    }
  })) as any;

  try {
    const response = await PUT(
      new Request("http://localhost/api/bookings/booking-1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "NO_SHOW" })
      }),
      { params: Promise.resolve({ id: "booking-1" }) }
    );

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.error, "NO_SHOW kann erst nach Kursbeginn gesetzt werden");
  } finally {
    prisma.booking.findUnique = originalBookingFindUnique;
  }
});

test("rejects invalid booking status updates", async () => {
  const response = await PUT(
    new Request("http://localhost/api/bookings/booking-1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "INVALID" })
    }),
    { params: Promise.resolve({ id: "booking-1" }) }
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, "Ungültiger Buchungsstatus");
});

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

test("books 5 EUR late cancellation fee for non-premium members", async () => {
  const original = {
    bookingFindUnique: prisma.booking.findUnique,
    transaction: prisma.$transaction
  };

  let bookingUpdateData: any = null;
  let accountEntryUpsertArgs: any = null;

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
      startTime: new Date(Date.now() + 60 * 60 * 1000)
    }
  })) as any;

  prisma.$transaction = (async (callback: (tx: any) => Promise<any>) => {
    return callback({
      booking: {
        update: async ({ data }: { data: Record<string, unknown> }) => {
          bookingUpdateData = data;

          return {
            id: "booking-1",
            status: "CANCELLED_LATE",
            lateCancellationFeeCents: data.lateCancellationFeeCents,
            lateCancellationFeeBookedAt: data.lateCancellationFeeBookedAt
          };
        }
      },
      customerAccountEntry: {
        upsert: async (args: Record<string, unknown>) => {
          accountEntryUpsertArgs = args;

          return {
            id: "account-entry-1",
            bookingId: "booking-1",
            type: "LATE_CANCELLATION_FEE",
            amountCents: 500,
            billingStatus: "PENDING"
          };
        }
      },
      waitlist: {
        findFirst: async () => null
      }
    });
  }) as any;

  try {
    const response = await DELETE(new Request("http://localhost/api/bookings/booking-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "booking-1" })
    });

    assert.equal(response.status, 200);
    assert.equal(bookingUpdateData?.status, "CANCELLED_LATE");
    assert.equal(bookingUpdateData?.lateCancellationFeeCents, 500);
    assert.ok(bookingUpdateData?.lateCancellationFeeBookedAt instanceof Date);
    assert.deepEqual(accountEntryUpsertArgs, {
      where: {
        bookingId_type: {
          bookingId: "booking-1",
          type: "LATE_CANCELLATION_FEE"
        }
      },
      create: {
        memberId: "member-1",
        bookingId: "booking-1",
        type: "LATE_CANCELLATION_FEE",
        amountCents: 500,
        billingStatus: "PENDING",
        description: "Spaete Kursstornierung (< 2 Stunden)"
      },
      update: {
        amountCents: 500,
        billingStatus: "PENDING",
        billedAt: null,
        paidAt: null,
        description: "Spaete Kursstornierung (< 2 Stunden)"
      }
    });
  } finally {
    prisma.booking.findUnique = original.bookingFindUnique;
    prisma.$transaction = original.transaction;
  }
});

test("does not book late cancellation fee for premium members", async () => {
  const original = {
    bookingFindUnique: prisma.booking.findUnique,
    transaction: prisma.$transaction
  };

  let bookingUpdateData: any = null;
  let accountEntryUpsertCalled = false;

  prisma.booking.findUnique = (async () => ({
    id: "booking-1",
    status: "CONFIRMED",
    member: {
      membershipTier: {
        hasFreeLateCancellation: true
      }
    },
    course: {
      id: "course-1",
      startTime: new Date(Date.now() + 60 * 60 * 1000)
    }
  })) as any;

  prisma.$transaction = (async (callback: (tx: any) => Promise<any>) => {
    return callback({
      booking: {
        update: async ({ data }: { data: Record<string, unknown> }) => {
          bookingUpdateData = data;

          return {
            id: "booking-1",
            status: "CANCELLED_TIMELY",
            lateCancellationFeeCents: data.lateCancellationFeeCents,
            lateCancellationFeeBookedAt: data.lateCancellationFeeBookedAt
          };
        },
        create: async () => ({ id: "booking-promoted" })
      },
      customerAccountEntry: {
        upsert: async () => {
          accountEntryUpsertCalled = true;
          return { id: "should-not-exist" };
        }
      },
      waitlist: {
        findFirst: async () => null
      }
    });
  }) as any;

  try {
    const response = await DELETE(new Request("http://localhost/api/bookings/booking-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "booking-1" })
    });

    assert.equal(response.status, 200);
    assert.equal(bookingUpdateData?.status, "CANCELLED_TIMELY");
    assert.equal(bookingUpdateData?.lateCancellationFeeCents, null);
    assert.equal(bookingUpdateData?.lateCancellationFeeBookedAt, null);
    assert.equal(accountEntryUpsertCalled, false);
  } finally {
    prisma.booking.findUnique = original.bookingFindUnique;
    prisma.$transaction = original.transaction;
  }
});
