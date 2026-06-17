import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError, getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import { FEE_VIEW_ROLES } from "@/lib/fees/roles"

// GET /api/admin/fees/stats - Statistiques globales des frais
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, [...FEE_VIEW_ROLES])

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
    }

    if (!activeYearId) {
      return NextResponse.json({ data: emptyResult })
    }

    // 1. Tarifications actives avec devise
    const tarifications = await prisma.tarification.findMany({
      where: { schoolId: user.schoolId, yearId: activeYearId, isActive: true },
      include: {
        typeFrais: { select: { nom: true, code: true } },
        class: { select: { id: true, name: true } },
      },
    })

    // 2. Inscriptions actives
    const enrollments = await prisma.enrollment.findMany({
      where: {
        yearId: activeYearId,
        status: "ACTIVE",
        student: { user: { schoolId: user.schoolId } },
      },
      select: { id: true, studentId: true, classId: true },
    })

    // 3. Calculer les totaux attendus par devise et par élève
    type StudentBalance = {
      usdDue: number
      cdfDue: number
    }
    const studentBalances = new Map<number, StudentBalance>()

    let totalExpectedUsd = 0
    let totalExpectedCdf = 0

    for (const enrollment of enrollments) {
      let usdDue = 0
      let cdfDue = 0
      for (const tarif of tarifications) {
        if (tarif.classId === null || tarif.classId === enrollment.classId) {
          if (tarif.devise === "CDF") {
            cdfDue += tarif.montant
          } else {
            usdDue += tarif.montant
          }
        }
      }
      studentBalances.set(enrollment.studentId, { usdDue, cdfDue })
      totalExpectedUsd += usdDue
      totalExpectedCdf += cdfDue
    }

    // 4. Paiements perçus par devise
    const paiementsUsd = await prisma.paiement.aggregate({
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId, devise: "USD" },
        isAnnule: false,
      },
      _sum: { montant: true },
    })

    const paiementsCdf = await prisma.paiement.aggregate({
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId, devise: "CDF" },
        isAnnule: false,
      },
      _sum: { montant: true },
    })

    const totalCollectedUsd = paiementsUsd._sum.montant ?? 0
    const totalCollectedCdf = paiementsCdf._sum.montant ?? 0

    // 5. Statut par élève — paiements groupés par devise
    const studentPaymentsUsd = await prisma.paiement.groupBy({
      by: ["studentId"],
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId, devise: "USD" },
        isAnnule: false,
      },
      _sum: { montant: true },
    })

    const studentPaymentsCdf = await prisma.paiement.groupBy({
      by: ["studentId"],
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId, devise: "CDF" },
        isAnnule: false,
      },
      _sum: { montant: true },
    })

    const paidUsdByStudent = new Map(studentPaymentsUsd.map((p) => [p.studentId, p._sum.montant ?? 0]))
    const paidCdfByStudent = new Map(studentPaymentsCdf.map((p) => [p.studentId, p._sum.montant ?? 0]))

    let usdFullyPaid = 0
    let usdPartiallyPaid = 0
    let usdUnpaid = 0
    let cdfFullyPaid = 0
    let cdfPartiallyPaid = 0
    let cdfUnpaid = 0

    for (const [studentId, { usdDue, cdfDue }] of studentBalances) {
      if (usdDue > 0) {
        const paid = paidUsdByStudent.get(studentId) ?? 0
        if (paid >= usdDue) usdFullyPaid++
        else if (paid > 0) usdPartiallyPaid++
        else usdUnpaid++
      }
      if (cdfDue > 0) {
        const paid = paidCdfByStudent.get(studentId) ?? 0
        if (paid >= cdfDue) cdfFullyPaid++
        else if (paid > 0) cdfPartiallyPaid++
        else cdfUnpaid++
      }
    }

    // 6. Derniers paiements
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
        enrollment: { include: { class: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    // 7. Résumé par tarification
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
      paymentsGroupedByTarif.map((p) => [p.tarificationId, { total: p._sum.montant ?? 0, count: p._count.id }])
    )

    const tarificationsSummary = tarifications.map((t) => {
      const applicableStudents = enrollments.filter((e) => t.classId === null || t.classId === e.classId).length
      const payments = paymentsMap.get(t.id) || { total: 0, count: 0 }

      return {
        id: t.id,
        typeFrais: t.typeFrais.nom,
        classe: t.class?.name || "Toutes les classes",
        montant: t.montant,
        devise: t.devise,
        totalAttendu: t.montant * applicableStudents,
        totalPercu: payments.total,
        nombrePaiements: payments.count,
        nombreEleves: applicableStudents,
      }
    })

    return NextResponse.json({
      data: {
        usd: {
          totalExpected: totalExpectedUsd,
          totalCollected: totalCollectedUsd,
          totalPending: totalExpectedUsd - totalCollectedUsd,
          studentsFullyPaid: usdFullyPaid,
          studentsPartiallyPaid: usdPartiallyPaid,
          studentsUnpaid: usdUnpaid,
        },
        cdf: {
          totalExpected: totalExpectedCdf,
          totalCollected: totalCollectedCdf,
          totalPending: totalExpectedCdf - totalCollectedCdf,
          studentsFullyPaid: cdfFullyPaid,
          studentsPartiallyPaid: cdfPartiallyPaid,
          studentsUnpaid: cdfUnpaid,
        },
        totalStudents: enrollments.length,
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          numeroRecu: p.numeroRecu,
          studentName: `${p.student.lastName} ${p.student.middleName} ${p.student.firstName}`,
          studentCode: p.student.code,
          className: p.enrollment.class.name,
          typeFrais: p.tarification.typeFrais.nom,
          montant: p.montant,
          devise: p.tarification.devise,
          datePaiement: p.datePaiement,
          modePaiement: p.modePaiement,
        })),
        tarificationsSummary,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
