import type { NotificationTarget, Prisma } from "@prisma/client"

type ScopeInput = {
  userId: number
  userRole: string
  userSchoolId?: number
}

const SCHOOL_TARGETS: NotificationTarget[] = ["SCHOOL_USER_ONLY", "ALL"]
const SUPER_TARGETS: NotificationTarget[] = ["SUPER_ADMIN_ONLY", "ALL"]

/** Filtre commun liste / compteur / tout marquer comme lu. */
export function notificationScopeWhere({
  userId,
  userRole,
  userSchoolId,
}: ScopeInput): Prisma.NotificationWhereInput {
  if (userRole === "SUPER_ADMIN") {
    return {
      OR: [
        { userId: null, targetRole: { in: SUPER_TARGETS } },
        { userId },
      ],
    }
  }

  return {
    OR: [
      {
        userId: null,
        targetRole: { in: SCHOOL_TARGETS },
        ...(userSchoolId ? { schoolId: userSchoolId } : {}),
      },
      {
        userId,
        targetRole: { in: SCHOOL_TARGETS },
      },
    ],
  }
}
