import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

// GET /api/admin/fees/treasury/expenses — Liste dépenses
// POST — Créer une dépense
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const categorie = searchParams.get("categorie")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const where: Record<string, unknown> = { schoolId: user.schoolId }
    if (categorie) where.categorie = categorie
    if (dateFrom || dateTo) {
      where.dateDepense = {}
      if (dateFrom) (where.dateDepense as Record<string, unknown>).gte = new Date(dateFrom)
      if (dateTo) (where.dateDepense as Record<string, unknown>).lte = new Date(dateTo + "T23:59:59")
    }

    const expenses = await prisma.schoolExpense.findMany({
      where,
      orderBy: { dateDepense: "desc" },
    })

    const data = expenses.map((e) => ({
      id: e.id,
      categorie: e.categorie,
      motif: e.motif,
      montant: e.montant,
      beneficiaire: e.beneficiaire,
      modePaiement: e.modePaiement,
      reference: e.reference,
      dateDepense: e.dateDepense,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const body = await req.json()
    const { categorie, motif, montant, beneficiaire, modePaiement, reference } = body

    if (!motif || !montant) {
      return NextResponse.json(
        { error: "motif et montant sont requis" },
        { status: 400 }
      )
    }

    if (montant <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être positif" },
        { status: 400 }
      )
    }

    const expense = await prisma.schoolExpense.create({
      data: {
        schoolId: user.schoolId,
        categorie: categorie || "AUTRE",
        motif,
        montant: parseFloat(montant),
        beneficiaire: beneficiaire || null,
        modePaiement: modePaiement || "CASH",
        reference: reference || null,
        createdBy: user.id,
      },
    })

    return NextResponse.json({ data: expense }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
