import { NextRequest, NextResponse } from "next/server"
import { getParentFromRequest } from "@/lib/parent-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import {
  communiqueAudienceFilter,
  communiqueYearFilter,
  getUserReadCommuniqueIds,
  mergeCommuniqueWhere,
} from "@/lib/communique-user-read"

export async function GET(req: NextRequest) {
  const ctx = await getParentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  const where = mergeCommuniqueWhere(
    communiqueYearFilter(ctx.schoolId, yearId),
    communiqueAudienceFilter("parents")
  )
  const readIds = await getUserReadCommuniqueIds(ctx.userId)

  const [communiques, total] = await Promise.all([
    prisma.communique.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        attachmentName: true,
        attachmentMime: true,
        // Ne pas renvoyer le data URL en liste (trop lourd)
        createdBy: { select: { name: true, nom: true, prenom: true } },
      },
    }),
    prisma.communique.count({ where }),
  ])

  return NextResponse.json({
    communiques: communiques.map((c) => ({
      ...c,
      hasAttachment: Boolean(c.attachmentName),
      isRead: readIds.has(c.id),
    })),
    total,
    page,
    hasMore: skip + communiques.length < total,
  })
}
