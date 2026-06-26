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
    return NextResponse.json({ communiques: [], total: 0, page: 1, hasMore: false })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  const where = { schoolId: ctx.schoolId, yearId }

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
    communiques,
    total,
    page,
    hasMore: skip + communiques.length < total,
  })
}
