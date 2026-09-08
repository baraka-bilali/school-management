import { NextRequest, NextResponse } from "next/server"
import { getParentFromRequest } from "@/lib/parent-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import {
  communiqueAudienceFilter,
  communiqueYearFilter,
  mergeCommuniqueWhere,
} from "@/lib/communique-user-read"

export async function GET(req: NextRequest) {
  const ctx = await getParentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))
  const where = mergeCommuniqueWhere(
    communiqueYearFilter(ctx.schoolId, yearId),
    communiqueAudienceFilter("parents")
  )

  const unread = await prisma.communique.count({
    where: {
      ...where,
      userReads: { none: { userId: ctx.userId } },
    },
  })

  return NextResponse.json({ unread })
}
