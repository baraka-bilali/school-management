import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"

export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))
  if (!yearId) {
    return NextResponse.json({ unread: 0 })
  }

  const unread = await prisma.communique.count({
    where: {
      schoolId: ctx.schoolId,
      yearId,
      userReads: { none: { userId: ctx.userId } },
    },
  })

  return NextResponse.json({ unread })
}
