import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateTypeFraisSchema } from "@/lib/fees/validation"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/fees/types/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])
    const { id } = await params

    const typeFrais = await prisma.typeFrais.findUnique({
      where: { id: parseInt(id) },
      include: {
        tarifications: {
          include: {
            year: { select: { name: true } },
            class: { select: { name: true } },
            _count: { select: { paiements: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!typeFrais || typeFrais.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Type de frais introuvable" }, { status: 404 })
    }

    return NextResponse.json({ data: typeFrais })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/admin/fees/types/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])
    const { id } = await params

    const body = await req.json()
    const data = updateTypeFraisSchema.parse(body)

    const existing = await prisma.typeFrais.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Type de frais introuvable" }, { status: 404 })
    }

    // Si le nom change, re-générer le code automatiquement
    const updateData: Record<string, unknown> = { ...data }
    if (data.nom && data.nom !== existing.nom) {
      const baseCode = data.nom
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .substring(0, 20)

      let code = baseCode
      let suffix = 1
      while (true) {
        const duplicate = await prisma.typeFrais.findUnique({
          where: { schoolId_code: { schoolId: user.schoolId, code } },
        })
        if (!duplicate || duplicate.id === parseInt(id)) break
        code = `${baseCode.substring(0, 17)}_${suffix}`
        suffix++
      }
      updateData.code = code
    }

    const updated = await prisma.typeFrais.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/admin/fees/types/[id] - Désactiver (soft delete)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])
    const { id } = await params

    const existing = await prisma.typeFrais.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { tarifications: true } } },
    })

    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Type de frais introuvable" }, { status: 404 })
    }

    // Soft delete : désactiver au lieu de supprimer
    const updated = await prisma.typeFrais.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    return NextResponse.json({ data: updated, message: "Type de frais désactivé" })
  } catch (error) {
    return handleApiError(error)
  }
}
