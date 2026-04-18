import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

// GET /api/admin/fees/treasury — Vue d'ensemble trésorerie
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const yearId = searchParams.get("yearId")

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
      return NextResponse.json({
        data: {
          totalIncome: 0,
          totalTeacherPayments: 0,
          totalExpenses: 0,
          balance: 0,
          teacherPayments: [],
          expenses: [],
          teachers: [],
        },
      })
    }

    // Revenus : total des paiements élèves
    const incomeAgg = await prisma.paiement.aggregate({
      where: {
        schoolId: user.schoolId,
        tarification: { yearId: activeYearId },
        isAnnule: false,
      },
      _sum: { montant: true },
    })
    const totalIncome = incomeAgg._sum.montant ?? 0

    // Salaires professeurs
    const teacherPaymentsAgg = await prisma.teacherPayment.aggregate({
      where: { schoolId: user.schoolId },
      _sum: { montant: true },
    })
    const totalTeacherPayments = teacherPaymentsAgg._sum.montant ?? 0

    // Dépenses
    const expensesAgg = await prisma.schoolExpense.aggregate({
      where: { schoolId: user.schoolId },
      _sum: { montant: true },
    })
    const totalExpenses = expensesAgg._sum.montant ?? 0

    const balance = totalIncome - totalTeacherPayments - totalExpenses

    // Derniers paiements profs
    const teacherPayments = await prisma.teacherPayment.findMany({
      where: { schoolId: user.schoolId },
      include: {
        teacher: {
          select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
        },
      },
      orderBy: { datePaiement: "desc" },
      take: 50,
    })

    // Dernières dépenses
    const expenses = await prisma.schoolExpense.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { dateDepense: "desc" },
      take: 50,
    })

    // Liste des profs
    const teachers = await prisma.teacher.findMany({
      where: { user: { schoolId: user.schoolId } },
      select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
      orderBy: { lastName: "asc" },
    })

    return NextResponse.json({
      data: {
        totalIncome,
        totalTeacherPayments,
        totalExpenses,
        balance,
        teacherPayments: teacherPayments.map((tp) => ({
          id: tp.id,
          teacherId: tp.teacherId,
          teacherName: `${tp.teacher.lastName} ${tp.teacher.middleName} ${tp.teacher.firstName}`,
          specialty: tp.teacher.specialty,
          montant: tp.montant,
          type: tp.type,
          mois: tp.mois,
          description: tp.description,
          modePaiement: tp.modePaiement,
          reference: tp.reference,
          datePaiement: tp.datePaiement,
        })),
        expenses: expenses.map((e) => ({
          id: e.id,
          categorie: e.categorie,
          motif: e.motif,
          montant: e.montant,
          beneficiaire: e.beneficiaire,
          modePaiement: e.modePaiement,
          reference: e.reference,
          dateDepense: e.dateDepense,
        })),
        teachers: teachers.map((t) => ({
          id: t.id,
          name: `${t.lastName} ${t.middleName} ${t.firstName}`,
          specialty: t.specialty,
        })),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
