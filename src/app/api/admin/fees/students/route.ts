import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError, getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import { FEE_VIEW_ROLES } from "@/lib/fees/roles"
import { toDisplayCode } from "@/lib/student-fields"
import { ensureDefaultFeeType, getDefaultFeeTypeId } from "@/lib/fees/default-fee-type"

// GET /api/admin/fees/students - Liste des élèves avec résumé paiements
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, [...FEE_VIEW_ROLES])

    const { searchParams } = new URL(req.url)
    const yearId = searchParams.get("yearId")
    const classId = searchParams.get("classId")
    const typeFraisIdParam = searchParams.get("typeFraisId")
    const q = searchParams.get("q")?.trim() || ""

    await ensureDefaultFeeType(user.schoolId)
    const defaultTypeId = await getDefaultFeeTypeId(user.schoolId)
    const typeFraisIdFilter =
      typeFraisIdParam === "all"
        ? undefined
        : typeFraisIdParam
          ? parseInt(typeFraisIdParam)
          : defaultTypeId ?? undefined

    let activeYearId: number | undefined
    if (yearId) {
      activeYearId = parseInt(yearId)
    } else {
      activeYearId = (await getSchoolCurrentYearId(user.schoolId)) ?? undefined
    }

    if (!activeYearId) {
      return NextResponse.json({ data: [] })
    }

    const enrollmentWhere: Record<string, unknown> = {
      yearId: activeYearId,
      status: "ACTIVE",
      student: { user: { schoolId: user.schoolId } },
    }

    if (classId) {
      enrollmentWhere.classId = parseInt(classId)
    }

    if (q) {
      enrollmentWhere.student = {
        user: { schoolId: user.schoolId },
        OR: [
          { lastName: { contains: q } },
          { firstName: { contains: q } },
          { middleName: { contains: q } },
          { code: { contains: q } },
        ],
      }
    }

    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            code: true,
            gender: true,
          },
        },
        class: { select: { id: true, name: true } },
      },
      orderBy: { student: { lastName: "asc" } },
    })

    // Tarifications actives avec devise (optionnellement filtrées par type)
    const tarifWhere: Record<string, unknown> = {
      schoolId: user.schoolId,
      yearId: activeYearId,
      isActive: true,
    }
    if (typeFraisIdFilter) {
      tarifWhere.typeFraisId = typeFraisIdFilter
    }

    const tarifications = await prisma.tarification.findMany({
      where: tarifWhere,
      select: { id: true, montant: true, classId: true, devise: true, typeFraisId: true, typeFrais: { select: { nom: true } } },
    })

    const tarifIds = tarifications.map((t) => t.id)

    const paymentBaseWhere =
      tarifIds.length > 0
        ? { tarificationId: { in: tarifIds } }
        : { tarificationId: { in: [] as number[] } }

    const studentPaymentsUsd = await prisma.paiement.groupBy({
      by: ["studentId"],
      where: {
        schoolId: user.schoolId,
        ...paymentBaseWhere,
        tarification: { yearId: activeYearId, devise: "USD" },
        isAnnule: false,
      },
      _sum: { montant: true },
      _count: { id: true },
    })

    const studentPaymentsCdf = await prisma.paiement.groupBy({
      by: ["studentId"],
      where: {
        schoolId: user.schoolId,
        ...paymentBaseWhere,
        tarification: { yearId: activeYearId, devise: "CDF" },
        isAnnule: false,
      },
      _sum: { montant: true },
      _count: { id: true },
    })

    // Dernier paiement par étudiant (dans le périmètre filtré)
    const lastPayments = await prisma.paiement.findMany({
      where: {
        schoolId: user.schoolId,
        ...paymentBaseWhere,
        tarification: { yearId: activeYearId },
        isAnnule: false,
      },
      orderBy: { datePaiement: "desc" },
      distinct: ["studentId"],
      select: { studentId: true, datePaiement: true },
    })

    const paidUsdMap = new Map(studentPaymentsUsd.map((p) => [p.studentId, { total: p._sum.montant ?? 0, count: p._count.id }]))
    const paidCdfMap = new Map(studentPaymentsCdf.map((p) => [p.studentId, { total: p._sum.montant ?? 0, count: p._count.id }]))
    const lastPaymentMap = new Map(lastPayments.map((p) => [p.studentId, p.datePaiement]))

    const data = enrollments.map((e) => {
      let usdExpected = 0
      let cdfExpected = 0
      for (const t of tarifications) {
        if (t.classId === null || t.classId === e.classId) {
          if (t.devise === "CDF") {
            cdfExpected += t.montant
          } else {
            usdExpected += t.montant
          }
        }
      }

      const usdPaid = paidUsdMap.get(e.student.id)?.total ?? 0
      const cdfPaid = paidCdfMap.get(e.student.id)?.total ?? 0
      const paymentCount = (paidUsdMap.get(e.student.id)?.count ?? 0) + (paidCdfMap.get(e.student.id)?.count ?? 0)
      const lastDate = lastPaymentMap.get(e.student.id) || null

      const usdRemaining = Math.max(0, usdExpected - usdPaid)
      const cdfRemaining = Math.max(0, cdfExpected - cdfPaid)

      const usdPercent = usdExpected > 0 ? Math.round((usdPaid / usdExpected) * 100) : 0
      const cdfPercent = cdfExpected > 0 ? Math.round((cdfPaid / cdfExpected) * 100) : 0

      // Statut global : soldé uniquement si toutes les devises sont réglées
      const usdSolde = usdExpected === 0 || usdPaid >= usdExpected
      const cdfSolde = cdfExpected === 0 || cdfPaid >= cdfExpected
      let status: "solde" | "partiel" | "impaye"
      if (usdSolde && cdfSolde && (usdExpected > 0 || cdfExpected > 0)) {
        status = "solde"
      } else if (usdPaid > 0 || cdfPaid > 0) {
        status = "partiel"
      } else {
        status = "impaye"
      }

      return {
        studentId: e.student.id,
        enrollmentId: e.id,
        lastName: e.student.lastName,
        middleName: e.student.middleName,
        firstName: e.student.firstName,
        code: toDisplayCode(e.student.code, e.class.id),
        gender: e.student.gender,
        classId: e.class.id,
        className: e.class.name,
        usd: { expected: usdExpected, paid: usdPaid, remaining: usdRemaining, percent: usdPercent },
        cdf: { expected: cdfExpected, paid: cdfPaid, remaining: cdfRemaining, percent: cdfPercent },
        status,
        paymentCount,
        lastPaymentDate: lastDate,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}
