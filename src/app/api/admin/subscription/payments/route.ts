import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

// GET: Journal des paiements d'abonnement pour l'admin de l'école
export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || ""
    const token = cookieHeader.split("; ").find(row => row.startsWith("token="))?.split("=")[1]
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const allowedRoles = ["ADMIN", "DIRECTEUR_ETUDES", "DIRECTEUR_DISCIPLINE", "COMPTABLE"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    if (!decoded.schoolId) {
      return NextResponse.json({ error: "Aucune école associée" }, { status: 404 })
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"))
    const skip = (page - 1) * limit

    const [payments, total] = await prisma.$transaction([
      prisma.subscriptionPayment.findMany({
        where: { schoolId: decoded.schoolId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          numeroFacture: true,
          montant: true,
          devise: true,
          typePaiement: true,
          reference: true,
          dateDebut: true,
          dateFin: true,
          periode: true,
          plan: true,
          statut: true,
          notes: true,
          createdAt: true,
        },
      }),
      prisma.subscriptionPayment.count({ where: { schoolId: decoded.schoolId } }),
    ])

    return NextResponse.json({
      payments,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (e: any) {
    console.error("Erreur journal paiements:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
