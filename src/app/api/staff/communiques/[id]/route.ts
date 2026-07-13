import { NextRequest, NextResponse } from "next/server"
import { getStaffFromRequest } from "@/lib/staff-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import { markCommuniqueReadForUser } from "@/lib/communique-user-read"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getStaffFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const communiqueId = parseInt(id)
  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))

  const communique = await prisma.communique.findFirst({
    where: {
      id: communiqueId,
      schoolId: ctx.schoolId,
      ...(yearId ? { OR: [{ yearId }, { yearId: null }] } : {}),
    },
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

  return NextResponse.json({ communique })
}
