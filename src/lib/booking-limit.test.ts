import test from "node:test";
import assert from "node:assert/strict";

import { hasReachedMonthlyBookingLimit } from "./booking-limit";

test("blocks bookings once the tier limit is reached", () => {
  assert.equal(hasReachedMonthlyBookingLimit(4, 5), false);
  assert.equal(hasReachedMonthlyBookingLimit(5, 5), true);
  assert.equal(hasReachedMonthlyBookingLimit(6, 5), true);
});

test("does not block bookings when no monthly limit is configured", () => {
  assert.equal(hasReachedMonthlyBookingLimit(99, null), false);
  assert.equal(hasReachedMonthlyBookingLimit(99, undefined), false);
});
