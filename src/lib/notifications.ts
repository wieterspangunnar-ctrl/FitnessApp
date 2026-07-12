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

type PersonalTrainingBookingNotificationPayload = {
  trainer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  member: {
    id: string;
    firstName: string;
    lastName: string;
  };
  ptBooking: {
    id: string;
    startTime: Date;
    endTime: Date;
  };
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
  },

  async sendPersonalTrainingBookingNotification(payload: PersonalTrainingBookingNotificationPayload) {
    // Provider-neutral hook for FZ-059. Real delivery integration can replace this implementation.
    console.info("PERSONAL_TRAINING_BOOKING_NOTIFICATION_TRIGGERED", {
      type: "PERSONAL_TRAINING_BOOKING",
      channels: ["IN_APP", "EMAIL"],
      trainerId: payload.trainer.id,
      trainerEmail: payload.trainer.email,
      trainerFirstName: payload.trainer.firstName,
      trainerLastName: payload.trainer.lastName,
      memberId: payload.member.id,
      memberFirstName: payload.member.firstName,
      memberLastName: payload.member.lastName,
      ptBookingId: payload.ptBooking.id,
      ptStartTimeIso: payload.ptBooking.startTime.toISOString(),
      ptEndTimeIso: payload.ptBooking.endTime.toISOString(),
      triggeredAtIso: new Date().toISOString()
    });
  }
};

export type { ContractEndReminderNotificationPayload, WaitlistMoveUpNotificationPayload, PersonalTrainingBookingNotificationPayload };