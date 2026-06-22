import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError, getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import { FEE_VIEW_ROLES } from "@/lib/fees/roles"
import { toDisplayCode } from "@/lib/student-fields"
import { ensureDefaultFeeType, isDefaultFeeType } from "@/lib/fees/default-fee-type"
import { computeCurrencyStats, computeFeeTypeGroupSummaries } from "@/lib/fees/fee-stats.service"

function getDayBounds() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

async function getDailyCollected(schoolId: number, typeFraisId?: number) {
  const { start, end } = getDayBounds()
  const payments = await prisma.paiement.findMany({
    where: {
      schoolId,
      isAnnule: false,
      datePaiement: { gte: start, lt: end },
      ...(typeFraisId
        ? { tarification: { typeFraisId } }
        : {}),
    },
    select: {
      montant: true,
      tarification: { select: { devise: true } },
    },
  })

  let usd = 0
  let cdf = 0
  for (const p of payments) {
    if (p.tarification.devise === "USD") usd += p.montant
    else cdf += p.montant
  }

  return {
    usd,
    cdf,
    count: payments.length,
    date: start.toISOString().slice(0, 10),
  }
}

async function getPaidByStudent(
  schoolId: number,
  yearId: number,
  devise: "USD" | "CDF",
  typeFraisId?: number
) {
  const rows = await prisma.paiement.groupBy({
    by: ["studentId"],
    where: {
      schoolId,
      tarification: {
        yearId,
        devise,
        ...(typeFraisId ? { typeFraisId } : {}),
      },
      isAnnule: false,
    },
    _sum: { montant: true },
  })
  return new Map(rows.map((p) => [p.studentId, p._sum.montant ?? 0]))
}

// GET /api/admin/fees/stats - Statistiques globales des frais
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, [...FEE_VIEW_ROLES])

    await ensureDefaultFeeType(user.schoolId)

    const { searchParams } = new URL(req.url)
    const yearId = searchParams.get("yearId")

    let activeYearId: number | undefined
    if (yearId) {
      activeYearId = parseInt(yearId)
    } else {
      activeYearId = (await getSchoolCurrentYearId(user.schoolId)) ?? undefined
    }

    const emptyResult = {
      usd: { totalExpected: 0, totalCollected: 0, totalPending: 0, studentsFullyPaid: 0, studentsPartiallyPaid: 0, studentsUnpaid: 0 },
      cdf: { totalExpected: 0, totalCollected: 0, totalPending: 0, studentsFullyPaid: 0, studentsPartiallyPaid: 0, studentsUnpaid: 0 },
      totalStudents: 0,
      recentPayments: [],
      tarificationsSummary: [],
      feeTypesSummary: [],
      otherTypesSummary: [],
    }

    if (!activeYearId) {
      return NextResponse.json({ data: emptyResult })
    }

    const tarifications = await prisma.tarification.findMany({
      where: { schoolId: user.schoolId, yearId: activeYearId, isActive: true },
      include: {
        typeFrais: { select: { id: true, nom: true, code: true } },
        class: { select: { id: true, name: true } },
      },
    })

    const enrollments = await prisma.enrollment.findMany({
      where: {
        yearId: activeYearId,
        status: "ACTIVE",
        student: { user: { schoolId: user.schoolId } },
      },
      select: { id: true, studentId: true, classId: true },
    })

    const scolaireTarifs = tarifications.filter((t) => isDefaultFeeType(t.typeFrais))
    const defaultTypeId = scolaireTarifs[0]?.typeFrais.id

    const paidUsdScolaire = await getPaidByStudent(user.schoolId, activeYearId, "USD", defaultTypeId)
    const paidCdfScolaire = await getPaidByStudent(user.schoolId, activeYearId, "CDF", defaultTypeId)

    const scolaireStats = computeCurrencyStats(
      enrollments,
      scolaireTarifs.map((t) => ({
        id: t.id,
        montant: t.montant,
        classId: t.classId,
        devise: t.devise as "USD" | "CDF",
        typeFraisId: t.typeFrais.id,
        typeFrais: t.typeFrais,
      })),
      paidUsdScolaire,
      paidCdfScolaire
    )

    const paymentsGroupedByTarif = await prisma.paiement.groupBy({
      by: ["tarificationId"],
      where: {
        tarificationId: { in: tarifications.map((t) => t.id) },
        isAnnule: false,
      },
      _sum: { montant: true },
      _count: { id: true },
    })

    const paymentsMap = new Map(
      paymentsGroupedByTarif.map((p) => [p.tarificationId, p._sum.montant ?? 0])
    )

    const feeTypesSummary = computeFeeTypeGroupSummaries(
      enrollments,
      tarifications.map((t) => ({
        id: t.id,
        montant: t.montant,
        classId: t.classId,
        devise: t.devise as "USD" | "CDF",
        typeFraisId: t.typeFrais.id,
        typeFrais: t.typeFrais,
      })),
      paymentsMap
    )

    const otherTypesSummary = feeTypesSummary.filter((t) => !t.isDefault)

    const tarificationsSummary = scolaireTarifs.map((t) => {
      const applicableStudents = enrollments.filter((e) => t.classId === null || t.classId === e.classId).length
      const totalPercu = paymentsMap.get(t.id) ?? 0

      return {
        id: t.id,
        typeFrais: t.typeFrais.nom,
        classe: t.class?.name || "Toutes les classes",
        montant: t.montant,
        devise: t.devise,
        totalAttendu: t.montant * applicableStudents,
        totalPercu,
        nombrePaiements: paymentsGroupedByTarif.find((p) => p.tarificationId === t.id)?._count.id ?? 0,
        nombreEleves: applicableStudents,
      }
    })

    const recentPayments = await prisma.paiement.findMany({
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId },
        isAnnule: false,
      },
      include: {
        student: { select: { firstName: true, lastName: true, middleName: true, code: true } },
        tarification: {
          include: { typeFrais: { select: { nom: true } } },
        },
        enrollment: { include: { class: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({
      data: {
        usd: scolaireStats.usd,
        cdf: scolaireStats.cdf,
        totalStudents: enrollments.length,
        dailyCollected: await getDailyCollected(user.schoolId, defaultTypeId),
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          numeroRecu: p.numeroRecu,
          studentName: `${p.student.lastName} ${p.student.middleName} ${p.student.firstName}`,
          studentCode: toDisplayCode(p.student.code, p.enrollment.class.id, p.enrollment.yearId),
          className: p.enrollment.class.name,
          typeFrais: p.tarification.typeFrais.nom,
          montant: p.montant,
          devise: p.tarification.devise,
          datePaiement: p.datePaiement,
          modePaiement: p.modePaiement,
        })),
        tarificationsSummary,
        feeTypesSummary,
        otherTypesSummary,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
