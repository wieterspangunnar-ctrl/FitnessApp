export function getBookingWindowEnd(now: Date, bookingWindowDays: number) {
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + bookingWindowDays);
  return windowEnd;
}

export function isCourseWithinBookingWindow(
  courseStartTime: Date | string,
  bookingWindowDays: number,
  now: Date = new Date()
) {
  const start = new Date(courseStartTime);
  const windowEnd = getBookingWindowEnd(now, bookingWindowDays);

  return start >= now && start <= windowEnd;
}
