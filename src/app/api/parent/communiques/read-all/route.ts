import { NextRequest, NextResponse } from "next/server"
import { getParentFromRequest } from "@/lib/parent-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import {
  communiqueAudienceFilter,
  communiqueYearFilter,
  getUserReadCommuniqueIds,
  markAllCommuniquesReadForUser,
  mergeCommuniqueWhere,
} from "@/lib/communique-user-read"

export async function POST(req: NextRequest) {
  const ctx = await getParentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))
  const where = mergeCommuniqueWhere(
    communiqueYearFilter(ctx.schoolId, yearId),
    communiqueAudienceFilter("parents")
  )
  const readIds = await getUserReadCommuniqueIds(ctx.userId)

  const unread = await prisma.communique.findMany({
    where: {
      ...where,
      ...(readIds.size > 0 ? { id: { notIn: Array.from(readIds) } } : {}),
    },
    select: { id: true },
  })

  await markAllCommuniquesReadForUser(
    ctx.userId,
    unread.map((c) => c.id)
  )

  if (unread.length > 0) {
    await prisma.notification.updateMany({
      where: {
        userId: ctx.userId,
        isRead: false,
        OR: unread.map((c) => ({
          message: { startsWith: `COMMUNIQUE:${c.id}|` },
        })),
      },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ success: true })
}
