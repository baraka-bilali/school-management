import { NextRequest, NextResponse } from "next/server"
import { getStaffFromRequest } from "@/lib/staff-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import {
  communiqueYearFilter,
  getUserReadCommuniqueIds,
} from "@/lib/communique-user-read"

export async function GET(req: NextRequest) {
  const ctx = await getStaffFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  const where = communiqueYearFilter(ctx.schoolId, yearId)
  const readIds = await getUserReadCommuniqueIds(ctx.userId)

  const [communiques, total] = await Promise.all([
    prisma.communique.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        createdBy: { select: { name: true, nom: true, prenom: true } },
      },
    }),
    prisma.communique.count({ where }),
  ])

  return NextResponse.json({
    communiques: communiques.map((c) => ({
      ...c,
      isRead: readIds.has(c.id),
    })),
    total,
    page,
    hasMore: skip + communiques.length < total,
  })
}
