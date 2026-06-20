import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import { ensureDefaultFeeType, getDefaultFeeTypeId } from "@/lib/fees/default-fee-type"
import { SECTION_ORDER } from "@/lib/class-sort"

function emptySectionStats(): Record<string, number> {
  return Object.fromEntries(SECTION_ORDER.map((s) => [s, 0]))
}

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const schoolId = user.schoolId

    await ensureDefaultFeeType(schoolId)
    const defaultFeeTypeId = await getDefaultFeeTypeId(schoolId)
    const currentYearId = await getSchoolCurrentYearId(schoolId)

    const enrollmentWhere = currentYearId
      ? {
          yearId: currentYearId,
          status: "ACTIVE" as const,
          student: { user: { schoolId, isActive: true } },
        }
      : undefined

    const [teachersCount, classesCount, currentYearIdResolved] = await Promise.all([
      prisma.teacher.count({ where: { user: { schoolId, isActive: true } } }),
      prisma.class.count({ where: { schoolId } }),
      Promise.resolve(currentYearId),
    ])

    let currentYearName: string | null = null
    let sectionStats = emptySectionStats()
    let studentsCount = 0
    let maleCount = 0
    let femaleCount = 0

    if (currentYearIdResolved) {
      const year = await prisma.academicYear.findUnique({
        where: { id: currentYearIdResolved },
        select: { id: true, name: true },
      })
      currentYearName = year?.name ?? null

      if (year) {
        const enrollments = await prisma.enrollment.findMany({
          where: {
            yearId: year.id,
            status: "ACTIVE",
            student: { user: { schoolId, isActive: true } },
          },
          select: {
            class: { select: { section: true } },
            student: { select: { gender: true } },
          },
        })

        studentsCount = enrollments.length
        maleCount = enrollments.filter((e) => e.student.gender === "M").length
        femaleCount = enrollments.filter((e) => e.student.gender === "F").length

        for (const enrollment of enrollments) {
          const section = enrollment.class.section
          if (section && section in sectionStats) {
            sectionStats[section]++
          } else if (section) {
            sectionStats[section] = (sectionStats[section] ?? 0) + 1
          }
        }
      }
    } else {
      studentsCount = await prisma.student.count({
        where: { user: { schoolId, isActive: true } },
      })
      maleCount = await prisma.student.count({
        where: { user: { schoolId, isActive: true }, gender: "M" },
      })
      femaleCount = await prisma.student.count({
        where: { user: { schoolId, isActive: true }, gender: "F" },
      })
    }

    const currentDate = new Date()
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1)

    const paymentWhere: {
      schoolId: number
      datePaiement: { gte: Date }
      isAnnule: boolean
      tarification?: { yearId?: number; typeFraisId?: number }
    } = {
      schoolId,
      datePaiement: { gte: startDate },
      isAnnule: false,
    }

    if (currentYearIdResolved) {
      paymentWhere.tarification = {
        yearId: currentYearIdResolved,
        ...(defaultFeeTypeId ? { typeFraisId: defaultFeeTypeId } : {}),
      }
    } else if (defaultFeeTypeId) {
      paymentWhere.tarification = { typeFraisId: defaultFeeTypeId }
    }

    const [allTeachers, allPayments] = await Promise.all([
      prisma.teacher.findMany({
        where: { user: { schoolId } },
        select: { user: { select: { createdAt: true } } },
      }),
      prisma.paiement.findMany({
        where: paymentWhere,
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

      monthlyStudents.push(studentsCount)
      monthlyTeachers.push(
        allTeachers.filter((t) => t.user && new Date(t.user.createdAt) <= nextMonth).length
      )

      const monthPayments = allPayments.filter((p) => {
        const d = new Date(p.datePaiement)
        return d >= date && d < nextMonth
      })

      monthlyPaymentsUsd.push(
        monthPayments
          .filter((p) => p.tarification.devise !== "CDF")
          .reduce((sum, p) => sum + Number(p.montant), 0)
      )
      monthlyPaymentsCdf.push(
        monthPayments
          .filter((p) => p.tarification.devise === "CDF")
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
      sectionStats,
      currentYearId: currentYearIdResolved,
      currentYearName,
    })
  } catch (error) {
    console.error("[ERROR] Dashboard stats:", error)
    return handleApiError(error)
  }
}
