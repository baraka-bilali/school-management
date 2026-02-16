import { NextRequest, NextResponse } from "next/server"
import {
  getPaiementById,
  updatePaiement,
  annulerPaiement,
  updatePaiementSchema,
  annulerPaiementSchema,
  getReceiptData,
} from "@/lib/fees"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/fees/paiements/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])
    const { id } = await params

    const paiement = await getPaiementById(parseInt(id), user.schoolId)

    return NextResponse.json({ data: paiement })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/admin/fees/paiements/[id] - Modifier un paiement (avec historique)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])
    const { id } = await params

    const body = await req.json()
    const data = updatePaiementSchema.parse(body)

    const paiement = await updatePaiement({
      paiementId: parseInt(id),
      modifiePar: user.id,
      schoolId: user.schoolId,
      ...data,
    })

    return NextResponse.json({ data: paiement })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/admin/fees/paiements/[id] - Annuler un paiement (soft delete)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])
    const { id } = await params

    const body = await req.json()
    const data = annulerPaiementSchema.parse(body)

    const paiement = await annulerPaiement(
      parseInt(id),
      data.motifAnnulation,
      user.id,
      user.schoolId
    )

    return NextResponse.json({ data: paiement, message: "Paiement annulé" })
  } catch (error) {
    return handleApiError(error)
  }
}
