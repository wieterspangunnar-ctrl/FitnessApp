import test from "node:test";
import assert from "node:assert/strict";

import { getCancellationStatus } from "./cancellation-status";

test("stores timely cancellation when at least 2 hours remain", () => {
  const status = getCancellationStatus({
    courseStart: new Date("2026-07-15T10:00:00.000Z"),
    now: new Date("2026-07-15T08:00:00.000Z"),
    hasFreeLateCancellation: false
  });

  assert.equal(status, "CANCELLED_TIMELY");
});

test("stores late cancellation for non-premium members inside 2 hours", () => {
  const status = getCancellationStatus({
    courseStart: new Date("2026-07-15T10:00:00.000Z"),
    now: new Date("2026-07-15T08:30:00.000Z"),
    hasFreeLateCancellation: false
  });

  assert.equal(status, "CANCELLED_LATE");
});

test("applies premium late-cancellation exception inside 2 hours", () => {
  const status = getCancellationStatus({
    courseStart: new Date("2026-07-15T10:00:00.000Z"),
    now: new Date("2026-07-15T09:30:00.000Z"),
    hasFreeLateCancellation: true
  });

  assert.equal(status, "CANCELLED_TIMELY");
});
