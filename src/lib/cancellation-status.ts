import type { BookingStatus } from "@/generated/prisma/client";

type CancellationStatusInput = {
  courseStart: Date;
  now: Date;
  hasFreeLateCancellation: boolean;
};

export function getCancellationStatus({
  courseStart,
  now,
  hasFreeLateCancellation
}: CancellationStatusInput): Extract<BookingStatus, "CANCELLED_TIMELY" | "CANCELLED_LATE"> {
  const hoursBefore = (courseStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursBefore >= 2) {
    return "CANCELLED_TIMELY";
  }

  return hasFreeLateCancellation ? "CANCELLED_TIMELY" : "CANCELLED_LATE";
}
