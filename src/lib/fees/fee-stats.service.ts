import { isDefaultFeeType } from "./default-fee-type"

type Devise = "USD" | "CDF"

export interface CurrencyStats {
  totalExpected: number
  totalCollected: number
  totalPending: number
  studentsFullyPaid: number
  studentsPartiallyPaid: number
  studentsUnpaid: number
}

export interface FeeTypeGroupSummary {
  typeFraisId: number
  typeFrais: string
  isDefault: boolean
  usd: Pick<CurrencyStats, "totalExpected" | "totalCollected" | "totalPending">
  cdf: Pick<CurrencyStats, "totalExpected" | "totalCollected" | "totalPending">
  tarificationCount: number
  nombreEleves: number
}

interface TarifRow {
  id: number
  montant: number
  classId: number | null
  devise: Devise
  typeFraisId: number
  typeFrais: { nom: string; code: string }
}

interface EnrollmentRow {
  studentId: number
  classId: number
}

export function computeCurrencyStats(
  enrollments: EnrollmentRow[],
  tarifications: TarifRow[],
  paidUsdByStudent: Map<number, number>,
  paidCdfByStudent: Map<number, number>
): { usd: CurrencyStats; cdf: CurrencyStats } {
  type StudentBalance = { usdDue: number; cdfDue: number }
  const studentBalances = new Map<number, StudentBalance>()

  let totalExpectedUsd = 0
  let totalExpectedCdf = 0

  for (const enrollment of enrollments) {
    let usdDue = 0
    let cdfDue = 0
    for (const tarif of tarifications) {
      if (tarif.classId === null || tarif.classId === enrollment.classId) {
        if (tarif.devise === "CDF") cdfDue += tarif.montant
        else usdDue += tarif.montant
      }
    }
    studentBalances.set(enrollment.studentId, { usdDue, cdfDue })
    totalExpectedUsd += usdDue
    totalExpectedCdf += cdfDue
  }

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

  const totalCollectedUsd = [...paidUsdByStudent.values()].reduce((a, b) => a + b, 0)
  const totalCollectedCdf = [...paidCdfByStudent.values()].reduce((a, b) => a + b, 0)

  return {
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
  }
}

export function computeFeeTypeGroupSummaries(
  enrollments: EnrollmentRow[],
  tarifications: TarifRow[],
  paymentsByTarif: Map<number, number>
): FeeTypeGroupSummary[] {
  const byType = new Map<number, TarifRow[]>()
  for (const t of tarifications) {
    const list = byType.get(t.typeFraisId) ?? []
    list.push(t)
    byType.set(t.typeFraisId, list)
  }

  const summaries: FeeTypeGroupSummary[] = []

  for (const [typeFraisId, tarifs] of byType) {
    const sample = tarifs[0]
    let totalExpectedUsd = 0
    let totalExpectedCdf = 0
    let totalCollectedUsd = 0
    let totalCollectedCdf = 0
    let maxStudents = 0

    for (const tarif of tarifs) {
      const applicable = enrollments.filter(
        (e) => tarif.classId === null || tarif.classId === e.classId
      ).length
      maxStudents = Math.max(maxStudents, applicable)
      const collected = paymentsByTarif.get(tarif.id) ?? 0
      if (tarif.devise === "CDF") {
        totalExpectedCdf += tarif.montant * applicable
        totalCollectedCdf += collected
      } else {
        totalExpectedUsd += tarif.montant * applicable
        totalCollectedUsd += collected
      }
    }

    summaries.push({
      typeFraisId,
      typeFrais: sample.typeFrais.nom,
      isDefault: isDefaultFeeType(sample.typeFrais),
      usd: {
        totalExpected: totalExpectedUsd,
        totalCollected: totalCollectedUsd,
        totalPending: totalExpectedUsd - totalCollectedUsd,
      },
      cdf: {
        totalExpected: totalExpectedCdf,
        totalCollected: totalCollectedCdf,
        totalPending: totalExpectedCdf - totalCollectedCdf,
      },
      tarificationCount: tarifs.length,
      nombreEleves: maxStudents,
    })
  }

  return summaries.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
    return a.typeFrais.localeCompare(b.typeFrais, "fr")
  })
}
