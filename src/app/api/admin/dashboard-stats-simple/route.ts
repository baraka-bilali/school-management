import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Dashboard stats API called')
    
    const user = getAuthUser(request)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const schoolId = user.schoolId
    console.log('[DEBUG] School ID:', schoolId)

    // Compter les élèves actifs de cette école
    const studentsCount = await prisma.student.count({
      where: {
        user: {
          schoolId,
          isActive: true,
        },
      },
    })

    // Compter les enseignants actifs de cette école
    const teachersCount = await prisma.teacher.count({
      where: {
        user: {
          schoolId,
          isActive: true,
        },
      },
    })

    // Compter les classes actives de cette école
    const classesCount = await prisma.class.count({
      where: {
        schoolId,
      },
    })

    // Récupérer les stats de genre
    const maleCount = await prisma.student.count({
      where: {
        user: {
          schoolId,
          isActive: true,
        },
        gender: "M",
      },
    })

    const femaleCount = await prisma.student.count({
      where: {
        user: {
          schoolId,
          isActive: true,
        },
        gender: "F",
      },
    })

    // Récupérer les stats par section (en utilisant les enrollments actuels)
    const currentYear = await prisma.academicYear.findFirst({
      where: { current: true },
    })

    let primaireCount = 0
    let secondaireCount = 0

    if (currentYear) {
      // Classes primaires (niveaux 1ère à 6ème)
      const primaireEnrollments = await prisma.enrollment.count({
        where: {
          yearId: currentYear.id,
          student: { 
            user: {
              schoolId,
              isActive: true,
            },
          },
          class: {
            level: {
              in: ["1ère", "2ème", "3ème", "4ème", "5ème", "6ème"],
            },
          },
        },
      })
      primaireCount = primaireEnrollments

      // Classes secondaires (le reste)
      const totalEnrollments = await prisma.enrollment.count({
        where: {
          yearId: currentYear.id,
          student: { 
            user: {
              schoolId,
              isActive: true,
            },
          },
        },
      })
      secondaireCount = totalEnrollments - primaireCount
    }

    // Récupérer les données mensuelles (derniers 12 mois) - OPTIMISÉ
    const currentDate = new Date()
    const monthLabels: string[] = []
    const monthlyStudents: number[] = []
    const monthlyTeachers: number[] = []
    const monthlyPayments: number[] = []

    // Calculer la date de début (il y a 12 mois)
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1)

    // Récupérer TOUS les students créés pour cette école (1 seule requête)
    const allStudents = await prisma.student.findMany({
      where: {
        user: {
          schoolId,
        },
      },
      select: {
        user: {
          select: {
            createdAt: true,
          },
        },
      },
    })

    // Récupérer TOUS les teachers créés pour cette école (1 seule requête)
    const allTeachers = await prisma.teacher.findMany({
      where: {
        user: {
          schoolId,
        },
      },
      select: {
        user: {
          select: {
            createdAt: true,
          },
        },
      },
    })

    // Récupérer TOUS les paiements des 12 derniers mois (1 seule requête)
    const allPayments = await prisma.paiement.findMany({
      where: {
        schoolId,
        datePaiement: {
          gte: startDate,
        },
        isAnnule: false,
      },
      select: {
        datePaiement: true,
        montant: true,
      },
    })

    // Générer les 12 derniers mois et calculer les stats en mémoire
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = date.toLocaleDateString("fr-FR", { month: "short" })
      monthLabels.push(monthName.charAt(0).toUpperCase() + monthName.slice(1))

      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)

      // Compter les étudiants créés jusqu'à la fin de ce mois (cumulatif)
      const studentsCount = allStudents.filter(
        (s) => s.user && new Date(s.user.createdAt) <= nextMonth
      ).length
      monthlyStudents.push(studentsCount)

      // Compter les enseignants créés jusqu'à la fin de ce mois (cumulatif)
      const teachersCount = allTeachers.filter(
        (t) => t.user && new Date(t.user.createdAt) <= nextMonth
      ).length
      monthlyTeachers.push(teachersCount)

      // Compter les paiements de ce mois
      const paymentsSum = allPayments
        .filter((p) => {
          const pDate = new Date(p.datePaiement)
          return pDate >= date && pDate < nextMonth
        })
        .reduce((sum, p) => sum + Number(p.montant), 0)
      monthlyPayments.push(paymentsSum)
    }

    // Calculer le taux de présence moyen (si disponible)
    const attendanceRate = "--" // TODO: implémenter si module présence existe

    console.log('[DEBUG] Stats:', { studentsCount, teachersCount, classesCount, maleCount, femaleCount })

    return NextResponse.json({
      students: studentsCount,
      teachers: teachersCount,
      classes: classesCount,
      attendance: attendanceRate,
      monthLabels,
      monthlyStudents,
      monthlyTeachers,
      monthlyPayments,
      genderStats: {
        male: maleCount,
        female: femaleCount,
      },
      sectionStats: {
        Primaire: primaireCount,
        Secondaire: secondaireCount,
      },
    })
  } catch (error) {
    console.error('[ERROR] Dashboard stats:', error)
    return handleApiError(error)
  }
}
