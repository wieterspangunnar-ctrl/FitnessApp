import type { Prisma } from "@/generated/prisma/client";

const POSITION_OFFSET = 100_000;

type WaitlistRow = {
  id: string;
  position: number;
  createdAt: Date;
};

function clampPosition(requested: number | null, size: number) {
  if (requested === null) {
    return size + 1;
  }

  if (requested < 1) {
    return 1;
  }

  if (requested > size + 1) {
    return size + 1;
  }

  return requested;
}

async function placeEntriesInTemporaryRange(tx: Prisma.TransactionClient, entries: WaitlistRow[]) {
  for (let index = 0; index < entries.length; index += 1) {
    await tx.waitlist.update({
      where: { id: entries[index].id },
      data: { position: POSITION_OFFSET + index + 1 }
    });
  }
}

async function writeFinalPositions(tx: Prisma.TransactionClient, orderedIds: string[]) {
  for (let index = 0; index < orderedIds.length; index += 1) {
    await tx.waitlist.update({
      where: { id: orderedIds[index] },
      data: { position: index + 1 }
    });
  }
}

export async function createWaitlistEntryWithStablePosition(args: {
  tx: Prisma.TransactionClient;
  memberId: string;
  courseId: string;
  requestedPosition: number | null;
}) {
  const { tx, memberId, courseId, requestedPosition } = args;

  const existing = await tx.waitlist.findMany({
    where: { courseId },
    select: { id: true, position: true, createdAt: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  });

  const insertPosition = clampPosition(requestedPosition, existing.length);

  await placeEntriesInTemporaryRange(tx, existing);

  const inserted = await tx.waitlist.create({
    data: {
      memberId,
      courseId,
      position: POSITION_OFFSET + existing.length + 1
    },
    include: {
      member: true,
      course: {
        include: { courseType: true, room: true, trainer: true }
      }
    }
  });

  const orderedIds = existing.map((entry) => entry.id);
  orderedIds.splice(insertPosition - 1, 0, inserted.id);

  await writeFinalPositions(tx, orderedIds);

  return tx.waitlist.findUniqueOrThrow({
    where: { id: inserted.id },
    include: {
      member: true,
      course: {
        include: { courseType: true, room: true, trainer: true }
      }
    }
  });
}

export async function moveWaitlistEntryToPosition(args: {
  tx: Prisma.TransactionClient;
  id: string;
  requestedPosition: number;
}) {
  const { tx, id, requestedPosition } = args;

  const current = await tx.waitlist.findUnique({
    where: { id },
    select: { id: true, courseId: true }
  });

  if (!current) {
    return null;
  }

  const entries = await tx.waitlist.findMany({
    where: { courseId: current.courseId },
    select: { id: true, position: true, createdAt: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  });

  const withoutCurrent = entries.filter((entry) => entry.id !== current.id);
  const targetPosition = clampPosition(requestedPosition, withoutCurrent.length);

  await placeEntriesInTemporaryRange(tx, entries);

  const orderedIds = withoutCurrent.map((entry) => entry.id);
  orderedIds.splice(targetPosition - 1, 0, current.id);

  await writeFinalPositions(tx, orderedIds);

  return tx.waitlist.findUniqueOrThrow({
    where: { id: current.id },
    include: {
      member: true,
      course: {
        include: { courseType: true, room: true, trainer: true }
      }
    }
  });
}

export async function deleteWaitlistEntryAndReindex(args: {
  tx: Prisma.TransactionClient;
  id: string;
}) {
  const { tx, id } = args;

  const current = await tx.waitlist.findUnique({
    where: { id },
    select: { id: true, courseId: true }
  });

  if (!current) {
    return null;
  }

  await tx.waitlist.delete({ where: { id: current.id } });

  const remaining = await tx.waitlist.findMany({
    where: { courseId: current.courseId },
    select: { id: true, position: true, createdAt: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  });

  await placeEntriesInTemporaryRange(tx, remaining);
  await writeFinalPositions(
    tx,
    remaining.map((entry) => entry.id)
  );

  return { success: true };
}