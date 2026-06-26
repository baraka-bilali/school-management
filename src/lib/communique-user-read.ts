import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/** IDs des communiqués lus par un utilisateur (prof, etc.) */
export async function getUserReadCommuniqueIds(userId: number): Promise<Set<number>> {
  try {
    const rows = await prisma.communiqueUserRead.findMany({
      where: { userId },
      select: { communiqueId: true },
    })
    return new Set(rows.map((r) => r.communiqueId))
  } catch {
    return new Set()
  }
}

export async function markCommuniqueReadForUser(userId: number, communiqueId: number): Promise<boolean> {
  try {
    await prisma.communiqueUserRead.upsert({
      where: { communiqueId_userId: { communiqueId, userId } },
      create: { communiqueId, userId },
      update: {},
    })
    return true
  } catch {
    return false
  }
}

export async function markAllCommuniquesReadForUser(userId: number, communiqueIds: number[]): Promise<boolean> {
  if (communiqueIds.length === 0) return true
  try {
    await prisma.communiqueUserRead.createMany({
      data: communiqueIds.map((communiqueId) => ({ communiqueId, userId })),
      skipDuplicates: true,
    })
    return true
  } catch {
    return false
  }
}

/** Filtre communiqués par école + année (inclut yearId null pour rétrocompatibilité) */
export function communiqueYearFilter(schoolId: number, yearId: number | null): Prisma.CommuniqueWhereInput {
  if (!yearId) return { schoolId }
  return {
    schoolId,
    OR: [{ yearId }, { yearId: null }],
  }
}

export const COMMUNIQUE_NOTIF_PREFIX = "COMMUNIQUE:"
export function communiqueNotificationMessage(title: string, communiqueId: number) {
  return `${COMMUNIQUE_NOTIF_PREFIX}${communiqueId}|Nouveau communiqué : ${title}`
}

export function parseCommuniqueIdFromNotification(message: string): number | null {
  if (!message.startsWith(COMMUNIQUE_NOTIF_PREFIX)) return null
  const match = message.match(/^COMMUNIQUE:(\d+)\|/)
  return match ? parseInt(match[1], 10) : null
}

export function displayNotificationMessage(message: string): string {
  if (message.startsWith(COMMUNIQUE_NOTIF_PREFIX)) {
    const pipe = message.indexOf("|")
    return pipe >= 0 ? message.slice(pipe + 1) : message
  }
  return message
}
