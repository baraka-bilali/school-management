import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"
const SUBSCRIPTION_PRICE_USD = 70
const SUBSCRIPTION_MONTHS = 1

async function requireSuperAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("Cookie") || req.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/)
  if (!match) return null
  try {
    const decoded = jwt.verify(match[1], JWT_SECRET) as any
    return decoded.role === "SUPER_ADMIN" ? decoded : null
  } catch {
    return null
  }
}

// PUT: Activer / renouveler l'abonnement mensuel d'une école (70 USD, 1 mois)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { id } = await context.params
    const schoolId = parseInt(id)
    if (isNaN(schoolId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 })

    const existingSchool = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!existingSchool) return NextResponse.json({ error: "École non trouvée" }, { status: 404 })

    const body = await req.json()
    const { dateDebutAbonnement, typePaiement, montantPaye } = body

    // Calculate start date: if provided use it, otherwise today
    const startDate = dateDebutAbonnement ? new Date(dateDebutAbonnement) : new Date()
    startDate.setHours(0, 0, 0, 0)

    // End date = start + 1 month
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + SUBSCRIPTION_MONTHS)
    endDate.setHours(23, 59, 59, 999)

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        dateDebutAbonnement: startDate,
        dateFinAbonnement: endDate,
        periodeAbonnement: "MENSUEL",
        planAbonnement: "Mensuel",
        typePaiement: typePaiement || "MOBILE_MONEY",
        montantPaye: montantPaye != null ? parseFloat(String(montantPaye)) : SUBSCRIPTION_PRICE_USD,
        etatCompte: "ACTIF",
      },
      select: {
        id: true,
        nomEtablissement: true,
        etatCompte: true,
        dateDebutAbonnement: true,
        dateFinAbonnement: true,
        periodeAbonnement: true,
        planAbonnement: true,
        typePaiement: true,
        montantPaye: true,
      },
    })

    return NextResponse.json({
      success: true,
      school: updatedSchool,
      message: `Abonnement activé jusqu'au ${endDate.toLocaleDateString("fr-FR")}`,
    })
  } catch (e: any) {
    console.error("Erreur abonnement:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
