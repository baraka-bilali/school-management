import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCached } from "@/lib/cache"

/**
 * Route optimisée pour récupérer toutes les statistiques du dashboard en une seule requête
 * Réduit 3 requêtes séparées en 1 seule requête avec Promise.all
 */
export async function GET() {
  try {
    // Cache key simple pour le dashboard
    const cacheKey = 'dashboard-stats'

    const result = await getCached(cacheKey, async () => {
      // Exécuter toutes les requêtes en parallèle pour maximiser la performance
      const [studentsCount, teachersCount, classes] = await Promise.all([
        // Compter les élèves
        prisma.student.count(),
        
        // Compter les enseignants
        prisma.teacher.count(),
        
        // Récupérer uniquement id et nom des classes (pas besoin de plus)
        prisma.class.findMany({
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
