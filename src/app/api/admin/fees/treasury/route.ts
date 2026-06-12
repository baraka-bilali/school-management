import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError, getSchoolCurrentYearId } from "@/lib/fees/api-helpers"

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
      activeYearId = (await getSchoolCurrentYearId(user.schoolId)) ?? undefined
    }

    if (!activeYearId) {
      return NextResponse.json({
        data: {
          totalIncomeUsd: 0,
          totalIncomeCdf: 0,
          totalTeacherPayments: 0,
          totalExpensesUsd: 0,
          totalExpensesCdf: 0,
          balanceUsd: 0,
          balanceCdf: 0,
          teacherPayments: [],
          expenses: [],
          teachers: [],
        },
      })
    }

    // Revenus : total des paiements élèves — séparé par devise
    const [incomeAggUsd, incomeAggCdf, teacherPaymentsAgg, expensesAggUsd, expensesAggCdf] = await Promise.all([
      prisma.paiement.aggregate({
        where: {
          schoolId: user.schoolId,
          tarification: { yearId: activeYearId, devise: "USD" },
          isAnnule: false,
        },
        _sum: { montant: true },
      }),
      prisma.paiement.aggregate({
        where: {
          schoolId: user.schoolId,
          tarification: { yearId: activeYearId, devise: "CDF" },
          isAnnule: false,
        },
        _sum: { montant: true },
      }),
      // Salaires professeurs (en USD)
      prisma.teacherPayment.aggregate({
        where: { schoolId: user.schoolId },
        _sum: { montant: true },
      }),
      // Dépenses USD
      prisma.schoolExpense.aggregate({
        where: { schoolId: user.schoolId, devise: "USD" },
        _sum: { montant: true },
      }),
      // Dépenses CDF
      prisma.schoolExpense.aggregate({
        where: { schoolId: user.schoolId, devise: "CDF" },
        _sum: { montant: true },
      }),
    ])

    const totalIncomeUsd = incomeAggUsd._sum.montant ?? 0
    const totalIncomeCdf = incomeAggCdf._sum.montant ?? 0
    const totalTeacherPayments = teacherPaymentsAgg._sum.montant ?? 0
    const totalExpensesUsd = expensesAggUsd._sum.montant ?? 0
    const totalExpensesCdf = expensesAggCdf._sum.montant ?? 0

    const balanceUsd = totalIncomeUsd - totalTeacherPayments - totalExpensesUsd
    const balanceCdf = totalIncomeCdf - totalExpensesCdf

    // Derniers paiements profs + dépenses + liste profs en parallèle
    const [teacherPayments, expenses, teachers] = await Promise.all([
      prisma.teacherPayment.findMany({
        where: { schoolId: user.schoolId },
        include: {
          teacher: {
            select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
          },
        },
        orderBy: { datePaiement: "desc" },
        take: 50,
      }),
      prisma.schoolExpense.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { dateDepense: "desc" },
        take: 50,
      }),
      prisma.teacher.findMany({
        where: { user: { schoolId: user.schoolId } },
        select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
        orderBy: { lastName: "asc" },
      }),
    ])

    return NextResponse.json({
      data: {
        totalIncomeUsd,
        totalIncomeCdf,
        totalTeacherPayments,
        totalExpensesUsd,
        totalExpensesCdf,
        balanceUsd,
        balanceCdf,
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
          devise: e.devise,
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
