import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateTarificationSchema } from "@/lib/fees/validation"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/fees/tarifications/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])
    const { id } = await params

    const tarification = await prisma.tarification.findUnique({
      where: { id: parseInt(id) },
      include: {
        typeFrais: { select: { id: true, nom: true, code: true } },
        year: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        echeances: { orderBy: { ordre: "asc" } },
        paiements: {
          where: { isAnnule: false },
          include: {
            student: { select: { firstName: true, lastName: true, code: true } },
          },
          orderBy: { datePaiement: "desc" },
          take: 20,
        },
        _count: { select: { paiements: true } },
      },
    })

    if (!tarification || tarification.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 })
    }

    return NextResponse.json({ data: tarification })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/admin/fees/tarifications/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])
    const { id } = await params

    const body = await req.json()
    const data = updateTarificationSchema.parse(body)

    const existing = await prisma.tarification.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 })
    }

    const updated = await prisma.tarification.update({
      where: { id: parseInt(id) },
      data,
      include: {
        typeFrais: { select: { nom: true, code: true } },
        year: { select: { name: true } },
        class: { select: { name: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/admin/fees/tarifications/[id] - Soft delete
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])
    const { id } = await params

    const existing = await prisma.tarification.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 })
    }

    const updated = await prisma.tarification.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    return NextResponse.json({ data: updated, message: "Tarification désactivée" })
  } catch (error) {
    return handleApiError(error)
  }
}
