import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const schoolId = user.schoolId

    const [studentsCount, teachersCount, classesCount, maleCount, femaleCount, currentYear] =
      await Promise.all([
        prisma.student.count({ where: { user: { schoolId, isActive: true } } }),
        prisma.teacher.count({ where: { user: { schoolId, isActive: true } } }),
        prisma.class.count({ where: { schoolId } }),
        prisma.student.count({ where: { user: { schoolId, isActive: true }, gender: "M" } }),
        prisma.student.count({ where: { user: { schoolId, isActive: true }, gender: "F" } }),
        prisma.academicYear.findFirst({ where: { current: true } }),
      ])

    let primaireCount = 0
    let secondaireCount = 0
    if (currentYear) {
      const [prim, total] = await Promise.all([
        prisma.enrollment.count({
          where: {
            yearId: currentYear.id,
            student: { user: { schoolId, isActive: true } },
            class: { level: { in: ["1ère", "2ème", "3ème", "4ème", "5ème", "6ème"] } },
          },
        }),
        prisma.enrollment.count({
          where: { yearId: currentYear.id, student: { user: { schoolId, isActive: true } } },
        }),
      ])
      primaireCount = prim
      secondaireCount = total - prim
    }

    // Données mensuelles (12 derniers mois)
    const currentDate = new Date()
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1)

    const [allStudents, allTeachers, allPayments] = await Promise.all([
      prisma.student.findMany({
        where: { user: { schoolId } },
        select: { user: { select: { createdAt: true } } },
      }),
      prisma.teacher.findMany({
        where: { user: { schoolId } },
        select: { user: { select: { createdAt: true } } },
      }),
      prisma.paiement.findMany({
        where: { schoolId, datePaiement: { gte: startDate }, isAnnule: false },
        select: {
          datePaiement: true,
          montant: true,
          tarification: { select: { devise: true } },
        },
      }),
    ])

    const monthLabels: string[] = []
    const monthlyStudents: number[] = []
    const monthlyTeachers: number[] = []
    const monthlyPaymentsUsd: number[] = []
    const monthlyPaymentsCdf: number[] = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)

      const monthName = date.toLocaleDateString("fr-FR", { month: "short" })
      monthLabels.push(monthName.charAt(0).toUpperCase() + monthName.slice(1))

      monthlyStudents.push(
        allStudents.filter(s => s.user && new Date(s.user.createdAt) <= nextMonth).length
      )
      monthlyTeachers.push(
        allTeachers.filter(t => t.user && new Date(t.user.createdAt) <= nextMonth).length
      )

      const monthPayments = allPayments.filter(p => {
        const d = new Date(p.datePaiement)
        return d >= date && d < nextMonth
      })

      monthlyPaymentsUsd.push(
        monthPayments
          .filter(p => p.tarification.devise !== "CDF")
          .reduce((sum, p) => sum + Number(p.montant), 0)
      )
      monthlyPaymentsCdf.push(
        monthPayments
          .filter(p => p.tarification.devise === "CDF")
          .reduce((sum, p) => sum + Number(p.montant), 0)
      )
    }

    return NextResponse.json({
      students: studentsCount,
      teachers: teachersCount,
      classes: classesCount,
      attendance: "--",
      monthLabels,
      monthlyStudents,
      monthlyTeachers,
      monthlyPaymentsUsd,
      monthlyPaymentsCdf,
      genderStats: { male: maleCount, female: femaleCount },
      sectionStats: { Primaire: primaireCount, Secondaire: secondaireCount },
    })
  } catch (error) {
    console.error('[ERROR] Dashboard stats:', error)
    return handleApiError(error)
  }
}
