import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateEcheanceSchema } from "@/lib/fees/validation"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/admin/fees/echeances/[id]
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])
    const { id } = await params

    const body = await req.json()
    const data = updateEcheanceSchema.parse(body)

    const echeance = await prisma.echeance.findUnique({
      where: { id: parseInt(id) },
      include: { tarification: true },
    })

    if (!echeance || echeance.tarification.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Échéance introuvable" }, { status: 404 })
    }

    // Vérifier le total si le montant change
    if (data.montant !== undefined && data.montant !== echeance.montant) {
      const otherSum = await prisma.echeance.aggregate({
        where: {
          tarificationId: echeance.tarificationId,
          id: { not: parseInt(id) },
        },
        _sum: { montant: true },
      })

      const totalAutres = otherSum._sum.montant ?? 0
      if (totalAutres + data.montant > echeance.tarification.montant) {
        return NextResponse.json(
          { error: "Le total des échéances dépasserait le montant de la tarification" },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.echeance.update({
      where: { id: parseInt(id) },
      data: {
        ...data,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : undefined,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/admin/fees/echeances/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])
    const { id } = await params

    const echeance = await prisma.echeance.findUnique({
      where: { id: parseInt(id) },
      include: { tarification: true },
    })

    if (!echeance || echeance.tarification.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Échéance introuvable" }, { status: 404 })
    }

    await prisma.echeance.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ message: "Échéance supprimée" })
  } catch (error) {
    return handleApiError(error)
  }
}
