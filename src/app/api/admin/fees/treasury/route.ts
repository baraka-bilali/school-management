import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError, getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import { ensureDefaultFeeType, getDefaultFeeTypeId, isDefaultFeeType } from "@/lib/fees/default-fee-type"

type IncomeSummary = {
  totalIncomeUsd: number
  totalIncomeCdf: number
  scolaireIncomeUsd: number
  scolaireIncomeCdf: number
  otherIncomeUsd: number
  otherIncomeCdf: number
  incomeByType: Array<{
    typeFraisId: number
    typeFrais: string
    isDefault: boolean
    usd: number
    cdf: number
  }>
}

async function computeStudentIncome(
  schoolId: number,
  defaultFeeTypeId: number | null,
  yearId: number,
  dateFrom?: Date,
  dateTo?: Date
): Promise<IncomeSummary> {
  const dateFilter =
    dateFrom && dateTo ? { datePaiement: { gte: dateFrom, lte: dateTo } } : {}

  const baseWhere = {
    schoolId,
    isAnnule: false,
    tarification: { yearId },
    ...dateFilter,
  }

  const tarifFilter = (extra: Record<string, unknown> = {}) => ({ yearId, ...extra })

  const [
    incomeAggUsd,
    incomeAggCdf,
    scolaireUsdAgg,
    scolaireCdfAgg,
    incomeByTypeRows,
  ] = await Promise.all([
    prisma.paiement.aggregate({
      where: { ...baseWhere, tarification: tarifFilter({ devise: "USD" }) },
      _sum: { montant: true },
    }),
    prisma.paiement.aggregate({
      where: { ...baseWhere, tarification: tarifFilter({ devise: "CDF" }) },
      _sum: { montant: true },
    }),
    defaultFeeTypeId
      ? prisma.paiement.aggregate({
          where: {
            ...baseWhere,
            tarification: tarifFilter({ devise: "USD", typeFraisId: defaultFeeTypeId }),
          },
          _sum: { montant: true },
        })
      : Promise.resolve({ _sum: { montant: 0 } }),
    defaultFeeTypeId
      ? prisma.paiement.aggregate({
          where: {
            ...baseWhere,
            tarification: tarifFilter({ devise: "CDF", typeFraisId: defaultFeeTypeId }),
          },
          _sum: { montant: true },
        })
      : Promise.resolve({ _sum: { montant: 0 } }),
    prisma.paiement.findMany({
      where: baseWhere,
      select: {
        montant: true,
        tarification: {
          select: {
            devise: true,
            typeFrais: { select: { id: true, nom: true, code: true } },
          },
        },
      },
    }),
  ])

  const totalIncomeUsd = incomeAggUsd._sum.montant ?? 0
  const totalIncomeCdf = incomeAggCdf._sum.montant ?? 0
  const scolaireIncomeUsd = scolaireUsdAgg._sum.montant ?? 0
  const scolaireIncomeCdf = scolaireCdfAgg._sum.montant ?? 0

  const incomeByTypeMap = new Map<
    number,
    { typeFraisId: number; typeFrais: string; isDefault: boolean; usd: number; cdf: number }
  >()
  for (const row of incomeByTypeRows) {
    const tf = row.tarification.typeFrais
    const entry = incomeByTypeMap.get(tf.id) ?? {
      typeFraisId: tf.id,
      typeFrais: tf.nom,
      isDefault: isDefaultFeeType(tf),
      usd: 0,
      cdf: 0,
    }
    if (row.tarification.devise === "CDF") entry.cdf += row.montant
    else entry.usd += row.montant
    incomeByTypeMap.set(tf.id, entry)
  }

  return {
    totalIncomeUsd,
    totalIncomeCdf,
    scolaireIncomeUsd,
    scolaireIncomeCdf,
    otherIncomeUsd: totalIncomeUsd - scolaireIncomeUsd,
    otherIncomeCdf: totalIncomeCdf - scolaireIncomeCdf,
    incomeByType: [...incomeByTypeMap.values()].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
      return a.typeFrais.localeCompare(b.typeFrais, "fr")
    }),
  }
}

// GET /api/admin/fees/treasury — Vue d'ensemble trésorerie (année scolaire + période)
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    await ensureDefaultFeeType(user.schoolId)
    const defaultFeeTypeId = await getDefaultFeeTypeId(user.schoolId)

    const { searchParams } = new URL(req.url)
    const yearIdParam = searchParams.get("yearId")
    const dateFromParam = searchParams.get("dateFrom")
    const dateToParam = searchParams.get("dateTo")
    const monthsParam = searchParams.get("months")

    let selectedYearId: number | undefined
    if (yearIdParam) {
      selectedYearId = parseInt(yearIdParam)
    } else {
      selectedYearId = (await getSchoolCurrentYearId(user.schoolId)) ?? undefined
    }

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined
    const dateTo = dateToParam ? new Date(dateToParam) : undefined
    const monthValues = monthsParam
      ? monthsParam.split(",").map((m) => m.trim()).filter(Boolean)
      : []

    const selectedYear = selectedYearId
      ? await prisma.academicYear.findUnique({
          where: { id: selectedYearId },
          select: { id: true, name: true },
        })
      : null

    const teacherPaymentWhere: {
      schoolId: number
      mois?: { in: string[] }
      datePaiement?: { gte: Date; lte: Date }
    } = { schoolId: user.schoolId }

    if (monthValues.length > 0) {
      teacherPaymentWhere.mois = { in: monthValues }
    }
    if (dateFrom && dateTo) {
      teacherPaymentWhere.datePaiement = { gte: dateFrom, lte: dateTo }
    }

    const expenseWhere: {
      schoolId: number
      dateDepense?: { gte: Date; lte: Date }
    } = { schoolId: user.schoolId }

    if (dateFrom && dateTo) {
      expenseWhere.dateDepense = { gte: dateFrom, lte: dateTo }
    } else if (monthValues.length > 0) {
      // Filtrer dépenses par mois calendaire de la période
      expenseWhere.dateDepense = {
        gte: new Date(`${monthValues[0]}-01`),
        lte: new Date(
          new Date(`${monthValues[monthValues.length - 1]}-01`).getFullYear(),
          new Date(`${monthValues[monthValues.length - 1]}-01`).getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        ),
      }
    }

    if (!selectedYearId) {
      const [teacherPaymentsAgg, expensesAggUsd, expensesAggCdf, teacherPayments, expenses, teachers] =
        await Promise.all([
          prisma.teacherPayment.aggregate({ where: teacherPaymentWhere, _sum: { montant: true } }),
          prisma.schoolExpense.aggregate({
            where: { ...expenseWhere, devise: "USD" },
            _sum: { montant: true },
          }),
          prisma.schoolExpense.aggregate({
            where: { ...expenseWhere, devise: "CDF" },
            _sum: { montant: true },
          }),
          prisma.teacherPayment.findMany({
            where: teacherPaymentWhere,
            include: {
              teacher: {
                select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
              },
            },
            orderBy: { datePaiement: "desc" },
            take: 50,
          }),
          prisma.schoolExpense.findMany({
            where: expenseWhere,
            orderBy: { dateDepense: "desc" },
            take: 50,
          }),
          prisma.teacher.findMany({
            where: { user: { schoolId: user.schoolId } },
            select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
            orderBy: { lastName: "asc" },
          }),
        ])

      const totalTeacherPayments = teacherPaymentsAgg._sum.montant ?? 0
      const totalExpensesUsd = expensesAggUsd._sum.montant ?? 0
      const totalExpensesCdf = expensesAggCdf._sum.montant ?? 0

      return NextResponse.json({
        data: {
          selectedYearId: null,
          selectedYearName: null,
          totalIncomeUsd: 0,
          totalIncomeCdf: 0,
          scolaireIncomeUsd: 0,
          scolaireIncomeCdf: 0,
          otherIncomeUsd: 0,
          otherIncomeCdf: 0,
          incomeByType: [],
          totalTeacherPayments,
          totalExpensesUsd,
          totalExpensesCdf,
          balanceUsd: -totalTeacherPayments - totalExpensesUsd,
          balanceCdf: -totalExpensesCdf,
          teacherPayments: teacherPayments.map(mapTeacherPayment),
          expenses: expenses.map(mapExpense),
          teachers: teachers.map(mapTeacher),
        },
      })
    }

    const yearIncome = await computeStudentIncome(
      user.schoolId,
      defaultFeeTypeId,
      selectedYearId,
      dateFrom,
      dateTo
    )

    const [teacherPaymentsAgg, expensesAggUsd, expensesAggCdf, teacherPayments, expenses, teachers] =
      await Promise.all([
        prisma.teacherPayment.aggregate({ where: teacherPaymentWhere, _sum: { montant: true } }),
        prisma.schoolExpense.aggregate({
          where: { ...expenseWhere, devise: "USD" },
          _sum: { montant: true },
        }),
        prisma.schoolExpense.aggregate({
          where: { ...expenseWhere, devise: "CDF" },
          _sum: { montant: true },
        }),
        prisma.teacherPayment.findMany({
          where: teacherPaymentWhere,
          include: {
            teacher: {
              select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
            },
          },
          orderBy: { datePaiement: "desc" },
          take: 50,
        }),
        prisma.schoolExpense.findMany({
          where: expenseWhere,
          orderBy: { dateDepense: "desc" },
          take: 50,
        }),
        prisma.teacher.findMany({
          where: { user: { schoolId: user.schoolId } },
          select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
          orderBy: { lastName: "asc" },
        }),
      ])

    const {
      totalIncomeUsd,
      totalIncomeCdf,
      scolaireIncomeUsd,
      scolaireIncomeCdf,
      otherIncomeUsd,
      otherIncomeCdf,
      incomeByType,
    } = yearIncome

    const totalTeacherPayments = teacherPaymentsAgg._sum.montant ?? 0
    const totalExpensesUsd = expensesAggUsd._sum.montant ?? 0
    const totalExpensesCdf = expensesAggCdf._sum.montant ?? 0

    return NextResponse.json({
      data: {
        selectedYearId,
        selectedYearName: selectedYear?.name ?? null,
        totalIncomeUsd,
        totalIncomeCdf,
        scolaireIncomeUsd,
        scolaireIncomeCdf,
        otherIncomeUsd,
        otherIncomeCdf,
        incomeByType,
        totalTeacherPayments,
        totalExpensesUsd,
        totalExpensesCdf,
        balanceUsd: totalIncomeUsd - totalTeacherPayments - totalExpensesUsd,
        balanceCdf: totalIncomeCdf - totalExpensesCdf,
        teacherPayments: teacherPayments.map(mapTeacherPayment),
        expenses: expenses.map(mapExpense),
        teachers: teachers.map(mapTeacher),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function mapTeacherPayment(tp: {
  id: number
  teacherId: number
  montant: number
  type: string
  mois: string
  description: string | null
  modePaiement: string
  reference: string | null
  datePaiement: Date
  teacher: { lastName: string; middleName: string; firstName: string; specialty: string | null }
}) {
  return {
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
  }
}

function mapExpense(e: {
  id: number
  categorie: string
  motif: string
  montant: number
  devise: string
  beneficiaire: string | null
  modePaiement: string
  reference: string | null
  dateDepense: Date
}) {
  return {
    id: e.id,
    categorie: e.categorie,
    motif: e.motif,
    montant: e.montant,
    devise: e.devise,
    beneficiaire: e.beneficiaire,
    modePaiement: e.modePaiement,
    reference: e.reference,
    dateDepense: e.dateDepense,
  }
}

function mapTeacher(t: {
  id: number
  lastName: string
  middleName: string
  firstName: string
  specialty: string | null
}) {
  return {
    id: t.id,
    name: `${t.lastName} ${t.middleName} ${t.firstName}`,
    specialty: t.specialty,
  }
}
