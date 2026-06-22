import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import { sortClasses } from "@/lib/class-sort"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

export async function GET(request: NextRequest) {
  try {
    // ✅ Vérification de l'authentification
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const schoolId = decoded.schoolId

    if (!schoolId) {
      return NextResponse.json(
        { error: "Aucune école associée à cet utilisateur" },
        { status: 403 }
      )
    }

    // ✅ Récupérer uniquement les classes de cette école
    const classes = sortClasses(
      await prisma.class.findMany({
        where: { schoolId },
      })
    )

    // Récupérer toutes les années académiques
    const years = await prisma.academicYear.findMany({
      orderBy: { name: 'desc' }
    })

    // Récupérer l'année courante de l'école
    const currentYearId = await getSchoolCurrentYearId(schoolId)

    return NextResponse.json({
      classes,
      years: years.map((y) => ({
        ...y,
        isCurrent: currentYearId ? y.id === currentYearId : false,
      })),
      currentYearId: currentYearId || null,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
