import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"

export async function POST(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))
  if (!yearId) {
    return NextResponse.json({ success: true })
  }

  const unread = await prisma.communique.findMany({
    where: {
      schoolId: ctx.schoolId,
      yearId,
      userReads: { none: { userId: ctx.userId } },
    },
    select: { id: true },
  })

  if (unread.length > 0) {
    await prisma.communiqueUserRead.createMany({
      data: unread.map((c) => ({ communiqueId: c.id, userId: ctx.userId })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ success: true })
}
