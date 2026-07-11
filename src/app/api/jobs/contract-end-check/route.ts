import { NextResponse } from "next/server";
import { getContractEndReminderCandidates } from "@/lib/contract-end-reminders";
import { notificationDispatcher } from "@/lib/notifications";

export const contractEndCheckDependencies = {
  getContractEndReminderCandidates,
  sendContractEndReminderNotification: notificationDispatcher.sendContractEndReminderNotification
};

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return true;
  }

  const providedSecret = request.headers.get("x-cron-secret") ?? "";
  return providedSecret === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const result = await contractEndCheckDependencies.getContractEndReminderCandidates();

    const sendIn14DaysPromise = Promise.all(
      result.dueIn14Days.map((member) =>
        contractEndCheckDependencies.sendContractEndReminderNotification({
          member: {
            id: member.id,
            email: member.email,
            firstName: member.firstName,
            lastName: member.lastName
          },
          contractEndDate: member.contractEndDate,
          daysUntilEnd: 14
        })
      )
    );

    const sendIn3DaysPromise = Promise.all(
      result.dueIn3Days.map((member) =>
        contractEndCheckDependencies.sendContractEndReminderNotification({
          member: {
            id: member.id,
            email: member.email,
            firstName: member.firstName,
            lastName: member.lastName
          },
          contractEndDate: member.contractEndDate,
          daysUntilEnd: 3
        })
      )
    );

    await Promise.all([sendIn14DaysPromise, sendIn3DaysPromise]);

    return NextResponse.json({
      checkedAt: result.checkedAt,
      referenceDate: result.referenceDate,
      dueIn14DaysCount: result.dueIn14Days.length,
      dueIn3DaysCount: result.dueIn3Days.length,
      sentIn14DaysCount: result.dueIn14Days.length,
      sentIn3DaysCount: result.dueIn3Days.length,
      dueIn14Days: result.dueIn14Days,
      dueIn3Days: result.dueIn3Days
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Taegliche Vertragsende-Pruefung fehlgeschlagen"
      },
      { status: 500 }
    );
  }
}