export function hasReachedMonthlyBookingLimit(
  activeBookingsThisMonth: number,
  maxCoursesPerMonth: number | null | undefined
) {
  if (maxCoursesPerMonth == null) {
    return false;
  }

  return activeBookingsThisMonth >= maxCoursesPerMonth;
}
