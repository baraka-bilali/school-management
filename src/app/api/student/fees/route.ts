import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateStudentFeesBreakdown } from "@/lib/fees/balance.service"
import { listPaiements } from "@/lib/fees/paiement.service"
import { getStudentFromRequest } from "@/lib/student-auth"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"

const YEAR_STATUSES = ["ACTIVE", "GRADUATED", "CONFIRMEE", "INACTIVE", "PROPOSEE"] as const

async function resolveFeesYearId(
  studentId: number,
  schoolId: number,
  requestedYearId: number | null,
  fallbackYearId: number | null
): Promise<{
  yearId: number | null
  year: { id: number; name: string; isCurrent: boolean } | null
  className: string | null
}> {
  const currentYearId = await getSchoolCurrentYearId(schoolId)

  const pickEnrollment = async (yearId: number) =>
    prisma.enrollment.findFirst({
      where: {
        studentId,
        yearId,
        status: { in: [...YEAR_STATUSES] },
        class: { schoolId },
      },
      include: {
        year: { select: { id: true, name: true } },
        class: { select: { name: true } },
      },
    })

  let yearId = requestedYearId
  if (yearId != null && !Number.isFinite(yearId)) yearId = null

  if (yearId == null && currentYearId != null) {
    const currentEnr = await pickEnrollment(currentYearId)
    if (currentEnr) yearId = currentYearId
  }
  if (yearId == null) yearId = fallbackYearId

  if (yearId == null) {
    return { yearId: null, year: null, className: null }
  }

  const enrollment = await pickEnrollment(yearId)
  if (!enrollment) {
    return { yearId: null, year: null, className: null }
  }

  return {
    yearId: enrollment.yearId,
    year: {
      id: enrollment.year.id,
      name: enrollment.year.name,
      isCurrent: currentYearId != null && enrollment.yearId === currentYearId,
    },
    className: enrollment.class.name,
  }
}

export async function GET(req: NextRequest) {
  const ctx = await getStudentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { studentId, schoolId } = ctx
  if (!schoolId) {
    return NextResponse.json({
      scolaire: null,
      autres: [],
      balance: null,
      paiements: [],
      year: null,
      message: "École introuvable",
    })
  }

  const searchParams = new URL(req.url).searchParams
  const summaryOnly = searchParams.get("summary") === "1"
  const yearIdRaw = searchParams.get("yearId")
  const requestedYearId = yearIdRaw ? Number(yearIdRaw) : null

  const resolved = await resolveFeesYearId(
    studentId!,
    schoolId,
    requestedYearId,
    ctx.yearId
  )

  if (!resolved.yearId) {
    return NextResponse.json({
      scolaire: null,
      autres: [],
      balance: null,
      paiements: [],
      year: null,
      yearId: null,
      message: "Aucune inscription pour cette année scolaire",
    })
  }

  const { yearId, year, className } = resolved

  try {
    if (summaryOnly) {
      const breakdown = await calculateStudentFeesBreakdown(studentId!, yearId, schoolId)
      return NextResponse.json({
        scolaire: breakdown.scolaire,
        autres: breakdown.autres,
        balance: breakdown.scolaire,
        paiements: [],
        yearId,
        year,
        className,
      })
    }

    const [breakdown, paiementsResult] = await Promise.all([
      calculateStudentFeesBreakdown(studentId!, yearId, schoolId),
      listPaiements({
        schoolId,
        studentId: studentId!,
        yearId,
        isAnnule: false,
        page: 1,
        pageSize: 20,
      }),
    ])

    const paiements = paiementsResult.data.map((p) => ({
      id: p.id,
      numeroRecu: p.numeroRecu,
      montant: p.montant,
      devise: p.tarification.devise,
      typeFrais: p.tarification.typeFrais.nom,
      datePaiement: p.datePaiement,
      modePaiement: p.modePaiement,
    }))

    return NextResponse.json({
      scolaire: breakdown.scolaire,
      autres: breakdown.autres,
      balance: breakdown.scolaire,
      paiements,
      yearId,
      year,
      className,
    })
  } catch (error) {
    console.error("Erreur frais élève:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
