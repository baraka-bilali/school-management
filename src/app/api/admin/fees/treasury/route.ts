import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError, getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import { ensureDefaultFeeType, getDefaultFeeTypeId, isDefaultFeeType } from "@/lib/fees/default-fee-type"
import { NON_STAFF_USER_ROLES } from "@/lib/staff-roles-server"
import { getStaffRoleLabel } from "@/lib/staff-roles"

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

    const salaryPaymentWhere: SalaryPaymentWhere = { schoolId: user.schoolId }

    if (monthValues.length > 0) {
      salaryPaymentWhere.mois = { in: monthValues }
    }
    if (dateFrom && dateTo) {
      salaryPaymentWhere.datePaiement = { gte: dateFrom, lte: dateTo }
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
      const [salaryOutflows, expensesAggUsd, expensesAggCdf, expenses] = await Promise.all([
        loadSalaryOutflows(user.schoolId, salaryPaymentWhere),
        prisma.schoolExpense.aggregate({
          where: { ...expenseWhere, devise: "USD" },
          _sum: { montant: true },
        }),
        prisma.schoolExpense.aggregate({
          where: { ...expenseWhere, devise: "CDF" },
          _sum: { montant: true },
        }),
        prisma.schoolExpense.findMany({
          where: expenseWhere,
          orderBy: { dateDepense: "desc" },
          take: 50,
        }),
      ])

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
          totalTeacherPayments: salaryOutflows.totalSalaryPayments,
          totalExpensesUsd,
          totalExpensesCdf,
          balanceUsd: -salaryOutflows.totalSalaryPayments - totalExpensesUsd,
          balanceCdf: -totalExpensesCdf,
          salaryPayments: salaryOutflows.salaryPayments,
          payees: salaryOutflows.payees,
          teacherPayments: salaryOutflows.salaryPayments,
          teachers: salaryOutflows.payees,
          expenses: expenses.map(mapExpense),
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

    const [salaryOutflows, expensesAggUsd, expensesAggCdf, expenses] = await Promise.all([
      loadSalaryOutflows(user.schoolId, salaryPaymentWhere),
      prisma.schoolExpense.aggregate({
        where: { ...expenseWhere, devise: "USD" },
        _sum: { montant: true },
      }),
      prisma.schoolExpense.aggregate({
        where: { ...expenseWhere, devise: "CDF" },
        _sum: { montant: true },
      }),
      prisma.schoolExpense.findMany({
        where: expenseWhere,
        orderBy: { dateDepense: "desc" },
        take: 50,
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
        totalTeacherPayments: salaryOutflows.totalSalaryPayments,
        totalExpensesUsd,
        totalExpensesCdf,
        balanceUsd: totalIncomeUsd - salaryOutflows.totalSalaryPayments - totalExpensesUsd,
        balanceCdf: totalIncomeCdf - totalExpensesCdf,
        salaryPayments: salaryOutflows.salaryPayments,
        payees: salaryOutflows.payees,
        teacherPayments: salaryOutflows.salaryPayments,
        teachers: salaryOutflows.payees,
        expenses: expenses.map(mapExpense),
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
  const payeeName = `${tp.teacher.lastName} ${tp.teacher.middleName} ${tp.teacher.firstName}`.replace(/\s+/g, " ").trim()
  return {
    id: tp.id,
    kind: "teacher" as const,
    payeeKey: `teacher:${tp.teacherId}`,
    teacherId: tp.teacherId,
    teacherName: payeeName,
    payeeName,
    specialty: tp.teacher.specialty,
    roleLabel: tp.teacher.specialty || "Professeur",
    montant: tp.montant,
    type: tp.type,
    mois: tp.mois,
    description: tp.description,
    modePaiement: tp.modePaiement,
    reference: tp.reference,
    datePaiement: tp.datePaiement,
  }
}

function mapStaffPayment(sp: {
  id: number
  userId: number
  montant: number
  type: string
  mois: string
  description: string | null
  modePaiement: string
  reference: string | null
  datePaiement: Date
  user: { nom: string | null; prenom: string | null; name: string; role: string }
}) {
  const payeeName = [sp.user.nom, sp.user.prenom].filter(Boolean).join(" ").trim() || sp.user.name
  return {
    id: sp.id,
    kind: "staff" as const,
    payeeKey: `staff:${sp.userId}`,
    userId: sp.userId,
    teacherId: sp.userId,
    teacherName: payeeName,
    payeeName,
    specialty: null,
    roleLabel: getStaffRoleLabel(sp.user.role),
    montant: sp.montant,
    type: sp.type,
    mois: sp.mois,
    description: sp.description,
    modePaiement: sp.modePaiement,
    reference: sp.reference,
    datePaiement: sp.datePaiement,
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
  const name = `${t.lastName} ${t.middleName} ${t.firstName}`.replace(/\s+/g, " ").trim()
  return {
    id: t.id,
    key: `teacher:${t.id}`,
    kind: "teacher" as const,
    name,
    specialty: t.specialty,
    roleLabel: t.specialty || "Professeur",
  }
}

function mapStaffPayee(u: {
  id: number
  nom: string | null
  prenom: string | null
  name: string
  role: string
}) {
  const name = [u.nom, u.prenom].filter(Boolean).join(" ").trim() || u.name
  return {
    id: u.id,
    key: `staff:${u.id}`,
    kind: "staff" as const,
    name,
    specialty: null,
    roleLabel: getStaffRoleLabel(u.role),
  }
}

type SalaryPaymentWhere = {
  schoolId: number
  mois?: { in: string[] }
  datePaiement?: { gte: Date; lte: Date }
}

async function loadSalaryOutflows(schoolId: number, where: SalaryPaymentWhere) {
  const staffPaymentDelegate = (prisma as { staffPayment?: typeof prisma.teacherPayment }).staffPayment

  const [
    teacherPaymentsAgg,
    staffPaymentsAgg,
    teacherPayments,
    staffPayments,
    teachers,
    staffUsers,
  ] = await Promise.all([
    prisma.teacherPayment.aggregate({ where, _sum: { montant: true } }),
    staffPaymentDelegate
      ? staffPaymentDelegate.aggregate({ where, _sum: { montant: true } })
      : Promise.resolve({ _sum: { montant: 0 } }),
    prisma.teacherPayment.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
        },
      },
      orderBy: { datePaiement: "desc" },
      take: 50,
    }),
    staffPaymentDelegate
      ? staffPaymentDelegate.findMany({
          where,
          include: {
            user: { select: { nom: true, prenom: true, name: true, role: true } },
          },
          orderBy: { datePaiement: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    prisma.teacher.findMany({
      where: { user: { schoolId } },
      select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
      orderBy: { lastName: "asc" },
    }),
    prisma.user.findMany({
      where: { schoolId, isActive: true, role: { notIn: NON_STAFF_USER_ROLES } },
      select: { id: true, nom: true, prenom: true, name: true, role: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    }),
  ])

  const salaryPayments = [
    ...teacherPayments.map(mapTeacherPayment),
    ...(staffPayments as Array<Parameters<typeof mapStaffPayment>[0]>).map(mapStaffPayment),
  ]
    .sort((a, b) => new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime())
    .slice(0, 50)

  const payees = [
    ...teachers.map(mapTeacher),
    ...staffUsers.map(mapStaffPayee),
  ]

  const totalSalaryPayments =
    (teacherPaymentsAgg._sum.montant ?? 0) + (staffPaymentsAgg._sum.montant ?? 0)

  return { totalSalaryPayments, salaryPayments, payees }
}
