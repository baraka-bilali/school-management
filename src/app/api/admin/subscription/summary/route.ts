import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildCumulativeSubscriptionView, toIsoDate } from "@/lib/subscription-period"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || ""
    const token = cookieHeader.split("; ").find((row) => row.startsWith("token="))?.split("=")[1]
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string; schoolId?: number }
    const allowedRoles = ["ADMIN", "DIRECTEUR_ETUDES", "DIRECTEUR_DISCIPLINE", "COMPTABLE"]
    if (!decoded.role || !allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    if (!decoded.schoolId) {
      return NextResponse.json({ error: "Aucune école associée" }, { status: 404 })
    }

    const school = await prisma.school.findUnique({
      where: { id: decoded.schoolId },
      select: {
        dateDebutAbonnement: true,
        dateFinAbonnement: true,
        etatCompte: true,
      },
    })

    if (!school) {
      return NextResponse.json({ error: "École introuvable" }, { status: 404 })
    }

    const payments = await prisma.subscriptionPayment.findMany({
      where: { schoolId: decoded.schoolId },
      orderBy: { dateDebut: "asc" },
      select: {
        dateDebut: true,
        dateFin: true,
        statut: true,
        numeroFacture: true,
        plan: true,
      },
    })

    const view = buildCumulativeSubscriptionView(
      school.dateDebutAbonnement,
      school.dateFinAbonnement,
      school.etatCompte,
      payments
    )

    return NextResponse.json({
      cumulativeStart: toIsoDate(view.cumulativeStart),
      cumulativeEnd: toIsoDate(view.cumulativeEnd),
      totalDays: view.totalDays,
      subscriptionCount: view.subscriptionCount,
      segments: view.segments,
      metrics: view.metrics,
    })
  } catch (e: unknown) {
    console.error("Erreur résumé abonnement:", e)
    const message = e instanceof Error ? e.message : "Erreur serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
