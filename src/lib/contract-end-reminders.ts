import { prisma } from "@/lib/prisma";

const CONTRACT_END_REMINDER_DAYS = [14, 3] as const;

type ReminderDay = (typeof CONTRACT_END_REMINDER_DAYS)[number];

type ContractEndReminderCandidate = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  contractEndDate: Date;
  daysUntilEnd: ReminderDay;
};

function addUtcDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getContractEndReminderCandidates(referenceDate: Date = new Date()) {
  const referenceDay = startOfUtcDay(referenceDate);
  const firstTargetDay = addUtcDays(referenceDay, 3);
  const lastTargetDay = addUtcDays(referenceDay, 14);

  const targetDayByKey = new Map<string, ReminderDay>(
    CONTRACT_END_REMINDER_DAYS.map((days) => [toUtcDateKey(addUtcDays(referenceDay, days)), days])
  );

  const members = await prisma.member.findMany({
    where: {
      status: {
        in: ["ACTIVE", "PAUSED"]
      },
      contractEndDate: {
        gte: startOfUtcDay(firstTargetDay),
        lte: endOfUtcDay(lastTargetDay)
      }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      contractEndDate: true
    },
    orderBy: {
      contractEndDate: "asc"
    }
  });

  const dueMembers: ContractEndReminderCandidate[] = members
    .map((member) => {
      const dayKey = toUtcDateKey(member.contractEndDate);
      const reminderDay = targetDayByKey.get(dayKey);

      if (!reminderDay) {
        return null;
      }

      return {
        ...member,
        daysUntilEnd: reminderDay
      };
    })
    .filter((member): member is ContractEndReminderCandidate => member !== null);

  return {
    checkedAt: new Date(),
    referenceDate: referenceDay,
    dueIn14Days: dueMembers.filter((member) => member.daysUntilEnd === 14),
    dueIn3Days: dueMembers.filter((member) => member.daysUntilEnd === 3)
  };
}

export type { ContractEndReminderCandidate, ReminderDay };