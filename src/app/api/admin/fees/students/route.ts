import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

// GET /api/admin/fees/students - Liste des élèves avec résumé paiements
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const yearId = searchParams.get("yearId")
    const classId = searchParams.get("classId")
    const q = searchParams.get("q")?.trim() || ""

    // Année scolaire
    let activeYearId: number | undefined
    if (yearId) {
      activeYearId = parseInt(yearId)
    } else {
      const currentYear = await prisma.academicYear.findFirst({
        where: { current: true },
        select: { id: true },
      })
      activeYearId = currentYear?.id
    }

    if (!activeYearId) {
      return NextResponse.json({ data: [] })
    }

    // Inscriptions actives
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

    // Tarifications actives
    const tarifications = await prisma.tarification.findMany({
      where: { schoolId: user.schoolId, yearId: activeYearId, isActive: true },
      select: { id: true, montant: true, classId: true, typeFraisId: true, typeFrais: { select: { nom: true } } },
    })

    // Paiements par étudiant
    const studentPayments = await prisma.paiement.groupBy({
      by: ["studentId"],
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId },
        isAnnule: false,
      },
      _sum: { montant: true },
      _count: { id: true },
    })

    // Dernier paiement par étudiant
    const lastPayments = await prisma.paiement.findMany({
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId },
        isAnnule: false,
      },
      orderBy: { datePaiement: "desc" },
      distinct: ["studentId"],
      select: { studentId: true, datePaiement: true },
    })

    const paymentMap = new Map(studentPayments.map((p) => [p.studentId, { total: p._sum.montant ?? 0, count: p._count.id }]))
    const lastPaymentMap = new Map(lastPayments.map((p) => [p.studentId, p.datePaiement]))

    const data = enrollments.map((e) => {
      // Montant attendu pour cet élève (tarifs globaux + tarifs spécifiques à sa classe)
      let totalExpected = 0
      for (const t of tarifications) {
        if (t.classId === null || t.classId === e.classId) {
          totalExpected += t.montant
        }
      }

      const paid = paymentMap.get(e.student.id)?.total ?? 0
      const count = paymentMap.get(e.student.id)?.count ?? 0
      const remaining = Math.max(0, totalExpected - paid)
      const percent = totalExpected > 0 ? Math.round((paid / totalExpected) * 100) : 0
      const lastDate = lastPaymentMap.get(e.student.id) || null

      let status: "solde" | "partiel" | "impaye"
      if (paid >= totalExpected && totalExpected > 0) {
        status = "solde"
      } else if (paid > 0) {
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
        code: e.student.code,
        gender: e.student.gender,
        classId: e.class.id,
        className: e.class.name,
        totalExpected,
        totalPaid: paid,
        remaining,
        percent,
        status,
        paymentCount: count,
        lastPaymentDate: lastDate,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}
