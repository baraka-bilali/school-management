import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

// GET /api/admin/fees/stats - Statistiques globales des frais
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const yearId = searchParams.get("yearId")

    // Trouver l'année scolaire courante si non spécifiée
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
      return NextResponse.json({
        data: {
          totalExpected: 0,
          totalCollected: 0,
          totalPending: 0,
          studentsFullyPaid: 0,
          studentsPartiallyPaid: 0,
          studentsUnpaid: 0,
          totalStudents: 0,
          recentPayments: [],
          tarificationsSummary: [],
        },
      })
    }

    // 1. Total attendu : somme des tarifications × nombre d'élèves inscrits concernés
    const tarifications = await prisma.tarification.findMany({
      where: { schoolId: user.schoolId, yearId: activeYearId, isActive: true },
      include: {
        typeFrais: { select: { nom: true, code: true } },
        class: { select: { id: true, name: true } },
      },
    })

    // Inscriptions actives pour cette année
    const enrollments = await prisma.enrollment.findMany({
      where: {
        yearId: activeYearId,
        status: "ACTIVE",
        student: { user: { schoolId: user.schoolId } },
      },
      select: { id: true, studentId: true, classId: true },
    })

    // Calculer le total attendu
    let totalExpected = 0
    const studentTarifications: Map<number, { total: number; studentId: number }> = new Map()

    for (const enrollment of enrollments) {
      let studentTotal = 0
      for (const tarif of tarifications) {
        // La tarification s'applique si elle est globale (classId null) ou correspond à la classe
        if (tarif.classId === null || tarif.classId === enrollment.classId) {
          studentTotal += tarif.montant
        }
      }
      totalExpected += studentTotal
      studentTarifications.set(enrollment.studentId, {
        total: studentTotal,
        studentId: enrollment.studentId,
      })
    }

    // 2. Total perçu
    const paiementsAgg = await prisma.paiement.aggregate({
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId },
        isAnnule: false,
      },
      _sum: { montant: true },
    })

    const totalCollected = paiementsAgg._sum.montant ?? 0
    const totalPending = totalExpected - totalCollected

    // 3. Statut par élève
    const studentPayments = await prisma.paiement.groupBy({
      by: ["studentId"],
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId },
        isAnnule: false,
      },
      _sum: { montant: true },
    })

    const paymentByStudent = new Map(
      studentPayments.map((p) => [p.studentId, p._sum.montant ?? 0])
    )

    let studentsFullyPaid = 0
    let studentsPartiallyPaid = 0
    let studentsUnpaid = 0

    for (const [studentId, { total }] of studentTarifications) {
      const paid = paymentByStudent.get(studentId) ?? 0
      if (paid >= total) {
        studentsFullyPaid++
      } else if (paid > 0) {
        studentsPartiallyPaid++
      } else {
        studentsUnpaid++
      }
    }

    // 4. Derniers paiements
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

    // 5. Résumé par tarification
    const tarificationsSummary = await Promise.all(
      tarifications.map(async (t) => {
        const agg = await prisma.paiement.aggregate({
          where: {
            tarificationId: t.id,
            isAnnule: false,
          },
          _sum: { montant: true },
          _count: { id: true },
        })

        const applicableStudents = enrollments.filter(
          (e) => t.classId === null || t.classId === e.classId
        ).length

        return {
          id: t.id,
          typeFrais: t.typeFrais.nom,
          classe: t.class?.name || "Toutes les classes",
          montant: t.montant,
          totalAttendu: t.montant * applicableStudents,
          totalPercu: agg._sum.montant ?? 0,
          nombrePaiements: agg._count.id,
          nombreEleves: applicableStudents,
        }
      })
    )

    return NextResponse.json({
      data: {
        totalExpected,
        totalCollected,
        totalPending,
        studentsFullyPaid,
        studentsPartiallyPaid,
        studentsUnpaid,
        totalStudents: enrollments.length,
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          numeroRecu: p.numeroRecu,
          studentName: `${p.student.lastName} ${p.student.middleName} ${p.student.firstName}`,
          studentCode: p.student.code,
          className: p.enrollment.class.name,
          typeFrais: p.tarification.typeFrais.nom,
          montant: p.montant,
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
