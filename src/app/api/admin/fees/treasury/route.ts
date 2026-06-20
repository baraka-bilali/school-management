import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError, getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import { ensureDefaultFeeType, getDefaultFeeTypeId, isDefaultFeeType } from "@/lib/fees/default-fee-type"

// GET /api/admin/fees/treasury — Vue d'ensemble trésorerie
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    await ensureDefaultFeeType(user.schoolId)
    const defaultFeeTypeId = await getDefaultFeeTypeId(user.schoolId)

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
      const [teacherPaymentsAgg, expensesAggUsd, expensesAggCdf, teacherPayments, expenses, teachers] =
        await Promise.all([
          prisma.teacherPayment.aggregate({
            where: { schoolId: user.schoolId },
            _sum: { montant: true },
          }),
          prisma.schoolExpense.aggregate({
            where: { schoolId: user.schoolId, devise: "USD" },
            _sum: { montant: true },
          }),
          prisma.schoolExpense.aggregate({
            where: { schoolId: user.schoolId, devise: "CDF" },
            _sum: { montant: true },
          }),
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

      const totalTeacherPayments = teacherPaymentsAgg._sum.montant ?? 0
      const totalExpensesUsd = expensesAggUsd._sum.montant ?? 0
      const totalExpensesCdf = expensesAggCdf._sum.montant ?? 0

      return NextResponse.json({
        data: {
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
    }

    // Revenus : total des paiements élèves — séparé par devise et par type (scolaire vs autres)
    const incomeWhereBase = {
      schoolId: user.schoolId,
      tarification: { yearId: activeYearId },
      isAnnule: false,
    } as const

    const [
      incomeAggUsd,
      incomeAggCdf,
      scolaireUsdAgg,
      scolaireCdfAgg,
      incomeByTypeRows,
      teacherPaymentsAgg,
      expensesAggUsd,
      expensesAggCdf,
    ] = await Promise.all([
      prisma.paiement.aggregate({
        where: { ...incomeWhereBase, tarification: { yearId: activeYearId, devise: "USD" } },
        _sum: { montant: true },
      }),
      prisma.paiement.aggregate({
        where: { ...incomeWhereBase, tarification: { yearId: activeYearId, devise: "CDF" } },
        _sum: { montant: true },
      }),
      defaultFeeTypeId
        ? prisma.paiement.aggregate({
            where: {
              ...incomeWhereBase,
              tarification: { yearId: activeYearId, devise: "USD", typeFraisId: defaultFeeTypeId },
            },
            _sum: { montant: true },
          })
        : Promise.resolve({ _sum: { montant: 0 } }),
      defaultFeeTypeId
        ? prisma.paiement.aggregate({
            where: {
              ...incomeWhereBase,
              tarification: { yearId: activeYearId, devise: "CDF", typeFraisId: defaultFeeTypeId },
            },
            _sum: { montant: true },
          })
        : Promise.resolve({ _sum: { montant: 0 } }),
      prisma.paiement.findMany({
        where: incomeWhereBase,
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
    const scolaireIncomeUsd = scolaireUsdAgg._sum.montant ?? 0
    const scolaireIncomeCdf = scolaireCdfAgg._sum.montant ?? 0
    const otherIncomeUsd = totalIncomeUsd - scolaireIncomeUsd
    const otherIncomeCdf = totalIncomeCdf - scolaireIncomeCdf

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
    const incomeByType = [...incomeByTypeMap.values()].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
      return a.typeFrais.localeCompare(b.typeFrais, "fr")
    })
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
        scolaireIncomeUsd,
        scolaireIncomeCdf,
        otherIncomeUsd,
        otherIncomeCdf,
        incomeByType,
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
