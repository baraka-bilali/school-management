import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import { communiqueYearFilter } from "@/lib/communique-user-read"

export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))
  const where = communiqueYearFilter(ctx.schoolId, yearId)

  // Comptage direct côté DB : communiqués sans entrée de lecture pour cet utilisateur.
  const unread = await prisma.communique.count({
    where: {
      ...where,
      userReads: { none: { userId: ctx.userId } },
    },
  })

  return NextResponse.json({ unread })
}
