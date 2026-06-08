import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

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

// GET: Liste de tous les paiements d'abonnement (super-admin)
export async function GET(req: NextRequest) {
  try {
    const user = await requireSuperAdmin(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "25"))
    const skip = (page - 1) * limit
    const schoolId = url.searchParams.get("schoolId")
      ? parseInt(url.searchParams.get("schoolId")!)
      : undefined
    const search = url.searchParams.get("search") || ""
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")

    const where: any = {}
    if (schoolId) where.schoolId = schoolId
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }
    if (search) {
      where.OR = [
        { numeroFacture: { contains: search, mode: "insensitive" } },
        { school: { nomEtablissement: { contains: search, mode: "insensitive" } } },
      ]
    }

    const [payments, total] = await prisma.$transaction([
      prisma.subscriptionPayment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          school: {
            select: {
              id: true,
              nomEtablissement: true,
              codeEtablissement: true,
              etatCompte: true,
            },
          },
          createdBy: {
            select: { id: true, prenom: true, nom: true },
          },
        },
      }),
      prisma.subscriptionPayment.count({ where }),
    ])

    // Totaux
    const totaux = await prisma.subscriptionPayment.aggregate({
      where,
      _sum: { montant: true },
      _count: { id: true },
    })

    return NextResponse.json({
      payments,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      totaux: {
        montantTotal: totaux._sum.montant || 0,
        nombrePaiements: totaux._count.id,
      },
    })
  } catch (e: any) {
    console.error("Erreur liste paiements super-admin:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
