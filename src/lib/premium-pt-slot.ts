function getUtcMonthWindow(slotStartTime: Date) {
  const startOfMonth = new Date(Date.UTC(slotStartTime.getUTCFullYear(), slotStartTime.getUTCMonth(), 1));
  const startOfNextMonth = new Date(Date.UTC(slotStartTime.getUTCFullYear(), slotStartTime.getUTCMonth() + 1, 1));

  return { startOfMonth, startOfNextMonth };
}

export function qualifiesForIncludedPremiumPtSlot(input: {
  includedPtSlotsPerMonth: number;
  alreadyUsedIncludedSlotsThisMonth: number;
}) {
  if (input.includedPtSlotsPerMonth <= 0) {
    return false;
  }

  return input.alreadyUsedIncludedSlotsThisMonth < input.includedPtSlotsPerMonth;
}

export function getIncludedPremiumPtSlotMonthWindow(slotStartTime: Date) {
  return getUtcMonthWindow(slotStartTime);
}