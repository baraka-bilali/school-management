import { prisma } from "@/lib/prisma"

/** Active lock = unlockedAt is null */
export async function findActiveGradeLock(params: {
  schoolId: number
  classId: number
  subjectId: number
  kind: "PERIOD" | "EXAM"
  periodId?: number | null
  periodGroupId?: number | null
}) {
  return prisma.gradeEntryLock.findFirst({
    where: {
      schoolId: params.schoolId,
      classId: params.classId,
      subjectId: params.subjectId,
      kind: params.kind,
      unlockedAt: null,
      ...(params.kind === "PERIOD" ? { periodId: params.periodId ?? undefined } : {}),
      ...(params.kind === "EXAM" ? { periodGroupId: params.periodGroupId ?? undefined } : {}),
    },
    orderBy: { lockedAt: "desc" },
  })
}

export async function assertPeriodNotLocked(params: {
  schoolId: number
  classId: number
  subjectId: number
  periodId: number
}) {
  const lock = await findActiveGradeLock({
    schoolId: params.schoolId,
    classId: params.classId,
    subjectId: params.subjectId,
    kind: "PERIOD",
    periodId: params.periodId,
  })
  if (lock) {
    return {
      locked: true as const,
      message:
        "Cette période est validée et verrouillée. Déverrouillez-la pour modifier les notes.",
    }
  }
  return { locked: false as const }
}

export async function assertExamNotLocked(params: {
  schoolId: number
  classId: number
  subjectId: number
  periodGroupId: number
}) {
  const lock = await findActiveGradeLock({
    schoolId: params.schoolId,
    classId: params.classId,
    subjectId: params.subjectId,
    kind: "EXAM",
    periodGroupId: params.periodGroupId,
  })
  if (lock) {
    return {
      locked: true as const,
      message:
        "Cet examen est validé et verrouillé. Déverrouillez-le pour modifier les notes.",
    }
  }
  return { locked: false as const }
}
