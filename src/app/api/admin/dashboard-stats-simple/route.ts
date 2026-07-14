import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import { ensureDefaultFeeType, getDefaultFeeTypeId } from "@/lib/fees/default-fee-type"
import { SECTION_ORDER } from "@/lib/class-sort"
import {
  getSchoolYearMonths,
  getEnrollmentCampaignMonths,
  schoolYearFromRecord,
  buildSchoolYearChartCumulative,
  buildSchoolYearChartMonthlyNew,
  buildEnrollmentCampaignMonthlyNew,
} from "@/lib/school-year-utils"

function emptySectionStats(): Record<string, number> {
  return Object.fromEntries(SECTION_ORDER.map((s) => [s, 0]))
}

function enrollmentDate(createdAt: Date, userCreatedAt: Date): Date {
  return createdAt.getTime() > 0 ? createdAt : userCreatedAt
}

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const schoolId = user.schoolId

    await ensureDefaultFeeType(schoolId)
    const defaultFeeTypeId = await getDefaultFeeTypeId(schoolId)
    const currentYearId = await getSchoolCurrentYearId(schoolId)

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
    let schoolYearMonths = getSchoolYearMonths(
      schoolYearFromRecord({ id: 0, name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` })
    )

    type EnrollmentPoint = { enrolledAt: Date; gender: string; section: string | null }

    let enrollmentTimeline: EnrollmentPoint[] = []
    let anneeBounds = schoolYearFromRecord({
      id: 0,
      name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    })

    if (currentYearIdResolved) {
      const year = await prisma.academicYear.findUnique({
        where: { id: currentYearIdResolved },
        select: { id: true, name: true, startDate: true, endDate: true },
      })
      currentYearName = year?.name ?? null

      if (year) {
        anneeBounds = schoolYearFromRecord(year)
        schoolYearMonths = getSchoolYearMonths(anneeBounds)

        const enrollments = await prisma.enrollment.findMany({
          where: {
            yearId: year.id,
            status: "ACTIVE",
            student: { user: { schoolId, isActive: true } },
          },
          select: {
            createdAt: true,
            class: { select: { section: true } },
            student: {
              select: {
                gender: true,
                user: { select: { createdAt: true } },
              },
            },
          },
        })

        studentsCount = enrollments.length
        maleCount = enrollments.filter((e) => e.student.gender === "M").length
        femaleCount = enrollments.filter((e) => e.student.gender === "F").length

        enrollmentTimeline = enrollments.map((e) => ({
          enrolledAt: enrollmentDate(e.createdAt, e.student.user.createdAt),
          gender: e.student.gender,
          section: e.class.section,
        }))

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

    const chartStart = schoolYearMonths[0]?.dateDebut ?? new Date()
    const chartEnd = schoolYearMonths[schoolYearMonths.length - 1]?.dateFin ?? new Date()

    const paymentWhere: {
      schoolId: number
      datePaiement: { gte: Date; lte: Date }
      isAnnule: boolean
      tarification?: { yearId?: number; typeFraisId?: number }
    } = {
      schoolId,
      datePaiement: { gte: chartStart, lte: chartEnd },
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

    const [allTeachers, allPayments, communiques] = await Promise.all([
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
      prisma.communique.findMany({
        where: {
          schoolId,
          ...(currentYearIdResolved ? { yearId: currentYearIdResolved } : {}),
        },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
    ])

    const monthLabels: string[] = []
    const enrollmentMonthLabels: string[] = []
    const monthlyStudents: number[] = []
    const monthlyStudentsNew: number[] = []
    const monthlyTeachers: number[] = []
    const monthlyTeachersNew: number[] = []
    const monthlyPaymentsUsd: number[] = []
    const monthlyPaymentsCdf: number[] = []

    const enrollmentDates = enrollmentTimeline.map((e) => e.enrolledAt)
    const teacherDates = allTeachers
      .filter((t) => t.user)
      .map((t) => new Date(t.user!.createdAt))

    const enrollmentCampaignMonths = getEnrollmentCampaignMonths(anneeBounds)

    monthlyStudentsNew.push(
      ...buildEnrollmentCampaignMonthlyNew(enrollmentDates, enrollmentCampaignMonths)
    )
    // Cumul aligné sur la campagne (utile côté API / rétrocompat)
    let enrollmentCumul = 0
    monthlyStudents.push(
      ...monthlyStudentsNew.map((n) => {
        enrollmentCumul += n
        return enrollmentCumul
      })
    )

    for (const month of enrollmentCampaignMonths) {
      const shortName = month.dateDebut.toLocaleDateString("fr-FR", { month: "short" })
      enrollmentMonthLabels.push(shortName.charAt(0).toUpperCase() + shortName.slice(1))
    }

    monthlyTeachers.push(
      ...buildSchoolYearChartCumulative(
        teacherDates,
        schoolYearMonths,
        anneeBounds.dateDebut,
        anneeBounds.dateFin
      )
    )
    monthlyTeachersNew.push(
      ...buildSchoolYearChartMonthlyNew(
        teacherDates,
        schoolYearMonths,
        anneeBounds.dateDebut,
        anneeBounds.dateFin
      )
    )

    for (const month of schoolYearMonths) {
      const shortName = month.dateDebut.toLocaleDateString("fr-FR", { month: "short" })
      monthLabels.push(shortName.charAt(0).toUpperCase() + shortName.slice(1))
    }

    for (let i = 0; i < schoolYearMonths.length; i++) {
      const month = schoolYearMonths[i]

      const monthPayments = allPayments.filter((p) => {
        const d = new Date(p.datePaiement)
        return d >= month.dateDebut && d <= month.dateFin
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

    const calendarEvents: Array<{ date: string; label: string; type: "year" | "communique" }> = []
    if (anneeBounds.dateDebut) {
      calendarEvents.push({
        date: anneeBounds.dateDebut.toISOString(),
        label: "Début de l'année scolaire",
        type: "year",
      })
    }
    if (anneeBounds.dateFin) {
      calendarEvents.push({
        date: anneeBounds.dateFin.toISOString(),
        label: "Fin de l'année scolaire",
        type: "year",
      })
    }
    for (const c of communiques) {
      calendarEvents.push({
        date: new Date(c.createdAt).toISOString(),
        label: c.title,
        type: "communique",
      })
    }

    return NextResponse.json({
      students: studentsCount,
      teachers: teachersCount,
      classes: classesCount,
      attendance: "--",
      monthLabels,
      enrollmentMonthLabels,
      monthlyStudents,
      monthlyStudentsNew,
      monthlyTeachers,
      monthlyTeachersNew,
      monthlyPaymentsUsd,
      monthlyPaymentsCdf,
      genderStats: { male: maleCount, female: femaleCount },
      sectionStats,
      currentYearId: currentYearIdResolved,
      currentYearName,
      calendarEvents,
    })
  } catch (error) {
    console.error("[ERROR] Dashboard stats:", error)
    return handleApiError(error)
  }
}
