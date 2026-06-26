import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import {
  communiqueYearFilter,
  getUserReadCommuniqueIds,
  markAllCommuniquesReadForUser,
} from "@/lib/communique-user-read"

export async function POST(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))
  const where = communiqueYearFilter(ctx.schoolId, yearId)
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

  return NextResponse.json({ success: true })
}
