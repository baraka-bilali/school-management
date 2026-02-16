import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createEcheanceSchema, createEcheancesBatchSchema, updateEcheanceSchema } from "@/lib/fees/validation"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

// GET /api/admin/fees/echeances?tarificationId=X
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const tarificationId = searchParams.get("tarificationId")

    if (!tarificationId) {
      return NextResponse.json(
        { error: "tarificationId est requis" },
        { status: 400 }
      )
    }

    // Vérifier que la tarification appartient à l'école
    const tarification = await prisma.tarification.findUnique({
      where: { id: parseInt(tarificationId) },
    })

    if (!tarification || tarification.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 })
    }

    const echeances = await prisma.echeance.findMany({
      where: { tarificationId: parseInt(tarificationId) },
      orderBy: { ordre: "asc" },
    })

    return NextResponse.json({ data: echeances })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/admin/fees/echeances - Créer une ou plusieurs échéances
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])

    const body = await req.json()

    // Déterminer si c'est un batch ou une création simple
    if (body.echeances && Array.isArray(body.echeances)) {
      // Création batch
      const data = createEcheancesBatchSchema.parse(body)

      // Vérifier que la tarification appartient à l'école
      const tarification = await prisma.tarification.findUnique({
        where: { id: data.tarificationId },
      })

      if (!tarification || tarification.schoolId !== user.schoolId) {
        return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 })
      }

      // Vérifier que le total des échéances ne dépasse pas le montant de la tarification
      const totalEcheances = data.echeances.reduce((sum, e) => sum + e.montant, 0)
      const existingEcheances = await prisma.echeance.aggregate({
        where: { tarificationId: data.tarificationId },
        _sum: { montant: true },
      })

      const totalExistant = existingEcheances._sum.montant ?? 0
      if (totalExistant + totalEcheances > tarification.montant) {
        return NextResponse.json(
          {
            error: `Le total des échéances (${totalExistant + totalEcheances}) dépasse le montant de la tarification (${tarification.montant})`,
          },
          { status: 400 }
        )
      }

      // Déterminer l'ordre de départ
      const maxOrdre = await prisma.echeance.findFirst({
        where: { tarificationId: data.tarificationId },
        orderBy: { ordre: "desc" },
        select: { ordre: true },
      })

      const startOrdre = (maxOrdre?.ordre ?? 0) + 1

      const echeancesData = data.echeances.map((e, index) => ({
        tarificationId: data.tarificationId,
        nom: e.nom,
        montant: e.montant,
        dateEcheance: new Date(e.dateEcheance),
        ordre: e.ordre ?? startOrdre + index,
      }))

      await prisma.echeance.createMany({ data: echeancesData })

      const created = await prisma.echeance.findMany({
        where: { tarificationId: data.tarificationId },
        orderBy: { ordre: "asc" },
      })

      return NextResponse.json({ data: created }, { status: 201 })
    } else {
      // Création simple
      const data = createEcheanceSchema.parse(body)

      const tarification = await prisma.tarification.findUnique({
        where: { id: data.tarificationId },
      })

      if (!tarification || tarification.schoolId !== user.schoolId) {
        return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 })
      }

      // Vérifier le total
      const existingSum = await prisma.echeance.aggregate({
        where: { tarificationId: data.tarificationId },
        _sum: { montant: true },
      })

      const totalExistant = existingSum._sum.montant ?? 0
      if (totalExistant + data.montant > tarification.montant) {
        return NextResponse.json(
          {
            error: `Le total des échéances dépasserait le montant de la tarification`,
          },
          { status: 400 }
        )
      }

      // Déterminer l'ordre
      const maxOrdre = await prisma.echeance.findFirst({
        where: { tarificationId: data.tarificationId },
        orderBy: { ordre: "desc" },
        select: { ordre: true },
      })

      const echeance = await prisma.echeance.create({
        data: {
          tarificationId: data.tarificationId,
          nom: data.nom,
          montant: data.montant,
          dateEcheance: new Date(data.dateEcheance),
          ordre: data.ordre ?? (maxOrdre?.ordre ?? 0) + 1,
        },
      })

      return NextResponse.json({ data: echeance }, { status: 201 })
    }
  } catch (error) {
    return handleApiError(error)
  }
}
