type WaitlistMoveUpNotificationPayload = {
  member: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  course: {
    id: string;
    startTime: Date;
    courseTypeName: string;
  };
};

type ContractEndReminderNotificationPayload = {
  member: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  contractEndDate: Date;
  daysUntilEnd: 14 | 3;
};

export const notificationDispatcher = {
  async sendWaitlistMoveUpNotification(payload: WaitlistMoveUpNotificationPayload) {
    // Provider-neutral hook for FZ-040. Real delivery integration can replace this implementation.
    console.info("WAITLIST_MOVE_UP_NOTIFICATION_TRIGGERED", {
      type: "WAITLIST_MOVE_UP",
      channels: ["IN_APP", "EMAIL"],
      memberId: payload.member.id,
      memberEmail: payload.member.email,
      courseId: payload.course.id,
      courseTypeName: payload.course.courseTypeName,
      courseStartTimeIso: payload.course.startTime.toISOString(),
      triggeredAtIso: new Date().toISOString()
    });
  },

  async sendContractEndReminderNotification(payload: ContractEndReminderNotificationPayload) {
    // Provider-neutral hook for BR8 reminders. Real delivery integration can replace this implementation.
    console.info("CONTRACT_END_REMINDER_NOTIFICATION_TRIGGERED", {
      type: "CONTRACT_END_REMINDER",
      channels: ["IN_APP", "EMAIL"],
      memberId: payload.member.id,
      memberEmail: payload.member.email,
      memberFirstName: payload.member.firstName,
      memberLastName: payload.member.lastName,
      contractEndDateIso: payload.contractEndDate.toISOString(),
      daysUntilEnd: payload.daysUntilEnd,
      triggeredAtIso: new Date().toISOString()
    });
  }
};

export type { ContractEndReminderNotificationPayload, WaitlistMoveUpNotificationPayload };