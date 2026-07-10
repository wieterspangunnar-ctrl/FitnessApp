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
  }
};

export type { WaitlistMoveUpNotificationPayload };