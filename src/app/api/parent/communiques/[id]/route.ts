import { NextRequest, NextResponse } from "next/server"
import { getParentFromRequest } from "@/lib/parent-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import {
  communiqueAudienceFilter,
  communiqueYearFilter,
  getUserReadCommuniqueIds,
  mergeCommuniqueWhere,
  markCommuniqueReadForUser,
} from "@/lib/communique-user-read"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getParentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const communiqueId = parseInt((await params).id, 10)
  if (isNaN(communiqueId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))
  const where = mergeCommuniqueWhere(
    { id: communiqueId },
    communiqueYearFilter(ctx.schoolId, yearId),
    communiqueAudienceFilter("parents")
  )

  const communique = await prisma.communique.findFirst({
    where,
    include: {
      createdBy: { select: { name: true, nom: true, prenom: true } },
    },
  })

  if (!communique) {
    return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 })
  }

  await markCommuniqueReadForUser(ctx.userId, communiqueId)

  await prisma.notification.updateMany({
    where: {
      userId: ctx.userId,
      isRead: false,
      message: { startsWith: `COMMUNIQUE:${communiqueId}|` },
    },
    data: { isRead: true },
  })

  const readIds = await getUserReadCommuniqueIds(ctx.userId)

  return NextResponse.json({
    communique: {
      ...communique,
      isRead: readIds.has(communique.id),
    },
  })
}
