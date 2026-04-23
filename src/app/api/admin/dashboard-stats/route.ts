import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCached } from "@/lib/cache"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

/**
 * Route optimisée pour récupérer les statistiques du dashboard filtrées par école
 * Réduit 3 requêtes séparées en 1 seule requête avec Promise.all
 */
export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
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

    // Cache key par école
    const cacheKey = `dashboard-stats-school-${schoolId}`

    const result = await getCached(cacheKey, async () => {
      // Exécuter toutes les requêtes en parallèle pour maximiser la performance
      // ✅ CORRECTION: Filtrer par schoolId pour isoler les données de chaque école
      const [studentsCount, teachersCount, classes] = await Promise.all([
        // Compter les élèves de cette école uniquement
        prisma.student.count({
          where: {
            user: {
              schoolId: schoolId
            }
          }
        }),
        
        // Compter les enseignants de cette école uniquement
        prisma.teacher.count({
          where: {
            user: {
              schoolId: schoolId
            }
          }
        }),
        
        // Récupérer uniquement les classes de cette école
        prisma.class.findMany({
          where: {
            schoolId: schoolId
          },
          select: {
            id: true,
            name: true
          },
          orderBy: {
            name: 'asc'
          }
        })
      ])

      return {
        students: studentsCount,
        teachers: teachersCount,
        classes: classes.length,
        classesData: classes, // Pour les filtres
        attendance: "94%" // TODO: Implémenter le calcul réel du taux de présence
      }
    }, 300000) // Cache de 5 minutes

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques dashboard:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        students: 0,
        teachers: 0,
        classes: 0,
        classesData: [],
        attendance: "0%"
      },
      { status: 500 }
    )
  }
}
