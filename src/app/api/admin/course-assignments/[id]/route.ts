import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)
    const { id } = await params

    const existing = await prisma.courseAssignment.findFirst({
      where: { id: parseInt(id), schoolId: user.schoolId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Affectation introuvable" }, { status: 404 })
    }

    await prisma.courseAssignment.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
