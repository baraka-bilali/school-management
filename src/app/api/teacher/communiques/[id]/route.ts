import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getTeacherFromRequest(req)
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
      ...(yearId ? { yearId } : {}),
    },
    include: {
      createdBy: { select: { name: true, nom: true, prenom: true } },
    },
  })

  if (!communique) {
    return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 })
  }

  await prisma.communiqueUserRead.upsert({
    where: {
      communiqueId_userId: { communiqueId, userId: ctx.userId },
    },
    create: { communiqueId, userId: ctx.userId },
    update: {},
  })

  return NextResponse.json({ communique })
}
