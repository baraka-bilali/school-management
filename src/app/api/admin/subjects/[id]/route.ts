import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)
    const { id } = await params
    const subjectId = parseInt(id)
    const body = await req.json()

    const existing = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: user.schoolId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Matière introuvable" }, { status: 404 })
    }

    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.code !== undefined ? { code: body.code.trim().toUpperCase() } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.coefficient !== undefined ? { coefficient: parseFloat(body.coefficient) } : {}),
        ...(body.maxWeeklyHours !== undefined ? { maxWeeklyHours: parseInt(body.maxWeeklyHours) } : {}),
      },
    })

    return NextResponse.json({ subject })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)
    const { id } = await params
    const subjectId = parseInt(id)

    const existing = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: user.schoolId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Matière introuvable" }, { status: 404 })
    }

    await prisma.subject.update({
      where: { id: subjectId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
