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

    // Si le code change, vérifier l'unicité
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.typeFrais.findUnique({
        where: { schoolId_code: { schoolId: user.schoolId, code: data.code } },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: `Le code "${data.code}" est déjà utilisé` },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.typeFrais.update({
      where: { id: parseInt(id) },
      data,
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
