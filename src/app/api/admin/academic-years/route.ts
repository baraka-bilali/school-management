import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

function requireAdmin(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (!["ADMIN", "SUPER_ADMIN"].includes(decoded.role)) return null
    return decoded
  } catch {
    return null
  }
}

// GET /api/admin/academic-years - Liste des années scolaires de l'école
export async function GET(req: NextRequest) {
  const user = requireAdmin(req)
  if (!user || !user.schoolId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    // Récupère les années qui ont des données pour cette école (enrollments ou tarifications)
    // Plus toutes celles créées sans données encore
    const years = await prisma.academicYear.findMany({
      orderBy: { name: "desc" },
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                class: { schoolId: user.schoolId },
              },
            },
            tarifications: {
              where: { schoolId: user.schoolId },
            },
          },
        },
      },
    })

    return NextResponse.json({ data: years })
  } catch (error) {
    console.error("Erreur chargement années scolaires:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/admin/academic-years - Créer une nouvelle année scolaire
export async function POST(req: NextRequest) {
  const user = requireAdmin(req)
  if (!user || !user.schoolId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const name = (body.name || "").trim()
    const startDate = body.startDate ? new Date(body.startDate) : null
    const endDate = body.endDate ? new Date(body.endDate) : null

    if (!name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 })
    }

    // Vérifier si l'année existe déjà
    const existing = await prisma.academicYear.findFirst({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: "Une année scolaire avec ce nom existe déjà" }, { status: 409 })
    }

    const year = await prisma.academicYear.create({
      data: {
        name,
        current: false,
        startDate,
        endDate,
      },
    })

    return NextResponse.json({ data: year }, { status: 201 })
  } catch (error) {
    console.error("Erreur création année scolaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
