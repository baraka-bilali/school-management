import { prisma } from "@/lib/prisma"
import { isDefaultFeeType } from "./default-fee-type"

/**
 * Calcul du solde d'un élève pour une tarification donnée.
 * RÈGLE : Ne jamais stocker le solde en base — toujours le calculer à la volée.
 *
 * solde = montant_total - SUM(paiements valides non annulés)
 */
export async function calculateBalance(
  studentId: number,
  tarificationId: number
): Promise<{
  montantTotal: number
  totalPaye: number
  solde: number
  nombrePaiements: number
  devise: "USD" | "CDF"
}> {
  const tarification = await prisma.tarification.findUnique({
    where: { id: tarificationId },
    select: { montant: true, devise: true },
  })

  if (!tarification) {
    throw new Error(`Tarification #${tarificationId} introuvable`)
  }

  const aggregate = await prisma.paiement.aggregate({
    where: {
      studentId,
      tarificationId,
      isAnnule: false,
    },
    _sum: { montant: true },
    _count: { id: true },
  })

  const totalPaye = aggregate._sum.montant ?? 0
  const solde = tarification.montant - totalPaye

  return {
    montantTotal: tarification.montant,
    totalPaye,
    solde,
    nombrePaiements: aggregate._count.id,
    devise: tarification.devise as "USD" | "CDF",
  }
}

/**
 * Calcul du solde global d'un élève pour toutes les tarifications
 * d'une année scolaire donnée. Les totaux sont séparés par devise.
 */
export async function calculateStudentYearBalance(
  studentId: number,
  yearId: number,
  schoolId: number
): Promise<{
  usd: { totalDu: number; totalPaye: number; solde: number }
  cdf: { totalDu: number; totalPaye: number; solde: number }
  details: Array<{
    tarificationId: number
    typeFrais: string
    montantTotal: number
    totalPaye: number
    solde: number
    devise: "USD" | "CDF"
  }>
}> {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, yearId, status: "ACTIVE" },
    select: { classId: true },
  })

  if (!enrollment) {
    throw new Error("Aucune inscription active trouvée pour cet élève dans cette année scolaire")
  }

  const tarifications = await prisma.tarification.findMany({
    where: {
      yearId,
      schoolId,
      isActive: true,
      OR: [
        { classId: null },
        { classId: enrollment.classId },
      ],
    },
    include: {
      typeFrais: { select: { nom: true } },
    },
  })

  const details = await Promise.all(
    tarifications.map(async (t) => {
      const balance = await calculateBalance(studentId, t.id)
      return {
        tarificationId: t.id,
        typeFrais: t.typeFrais.nom,
        montantTotal: balance.montantTotal,
        totalPaye: balance.totalPaye,
        solde: balance.solde,
        devise: balance.devise,
      }
    })
  )

  const usdDetails = details.filter((d) => d.devise === "USD")
  const cdfDetails = details.filter((d) => d.devise === "CDF")

  return {
    usd: {
      totalDu: usdDetails.reduce((acc, d) => acc + d.montantTotal, 0),
      totalPaye: usdDetails.reduce((acc, d) => acc + d.totalPaye, 0),
      solde: usdDetails.reduce((acc, d) => acc + d.solde, 0),
    },
    cdf: {
      totalDu: cdfDetails.reduce((acc, d) => acc + d.montantTotal, 0),
      totalPaye: cdfDetails.reduce((acc, d) => acc + d.totalPaye, 0),
      solde: cdfDetails.reduce((acc, d) => acc + d.solde, 0),
    },
    details,
  }
}

export interface StudentFeeTypeBalance {
  typeFraisId: number
  typeFrais: string
  isDefault: boolean
  usd: { totalDu: number; totalPaye: number; solde: number }
  cdf: { totalDu: number; totalPaye: number; solde: number }
}

function aggregateDetailsByType(
  details: Array<{
    tarificationId: number
    typeFrais: string
    typeFraisId?: number
    montantTotal: number
    totalPaye: number
    solde: number
    devise: "USD" | "CDF"
    isDefault?: boolean
  }>
): StudentFeeTypeBalance[] {
  const map = new Map<number, StudentFeeTypeBalance>()

  for (const d of details) {
    const key = d.typeFraisId ?? 0
    if (!map.has(key)) {
      map.set(key, {
        typeFraisId: key,
        typeFrais: d.typeFrais,
        isDefault: d.isDefault ?? false,
        usd: { totalDu: 0, totalPaye: 0, solde: 0 },
        cdf: { totalDu: 0, totalPaye: 0, solde: 0 },
      })
    }
    const entry = map.get(key)!
    const bucket = d.devise === "CDF" ? entry.cdf : entry.usd
    bucket.totalDu += d.montantTotal
    bucket.totalPaye += d.totalPaye
    bucket.solde += d.solde
  }

  return [...map.values()].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
    return a.typeFrais.localeCompare(b.typeFrais, "fr")
  })
}

/**
 * Solde élève ventilé : frais scolaires (défaut) + autres types séparément.
 */
export async function calculateStudentFeesBreakdown(
  studentId: number,
  yearId: number,
  schoolId: number
): Promise<{
  scolaire: { usd: { totalDu: number; totalPaye: number; solde: number }; cdf: { totalDu: number; totalPaye: number; solde: number } }
  autres: StudentFeeTypeBalance[]
  details: Array<{
    tarificationId: number
    typeFraisId: number
    typeFrais: string
    isDefault: boolean
    montantTotal: number
    totalPaye: number
    solde: number
    devise: "USD" | "CDF"
  }>
}> {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, yearId, status: "ACTIVE" },
    select: { classId: true },
  })

  if (!enrollment) {
    throw new Error("Aucune inscription active trouvée pour cet élève dans cette année scolaire")
  }

  const tarifications = await prisma.tarification.findMany({
    where: {
      yearId,
      schoolId,
      isActive: true,
      OR: [{ classId: null }, { classId: enrollment.classId }],
    },
    include: {
      typeFrais: { select: { id: true, nom: true, code: true } },
    },
  })

  const details = await Promise.all(
    tarifications.map(async (t) => {
      const balance = await calculateBalance(studentId, t.id)
      const defaultType = isDefaultFeeType(t.typeFrais)
      return {
        tarificationId: t.id,
        typeFraisId: t.typeFrais.id,
        typeFrais: t.typeFrais.nom,
        isDefault: defaultType,
        montantTotal: balance.montantTotal,
        totalPaye: balance.totalPaye,
        solde: balance.solde,
        devise: balance.devise,
      }
    })
  )

  const byType = aggregateDetailsByType(details)
  const scolaireEntry = byType.find((t) => t.isDefault)
  const autres = byType.filter((t) => !t.isDefault && (t.usd.totalDu > 0 || t.cdf.totalDu > 0))

  return {
    scolaire: {
      usd: scolaireEntry?.usd ?? { totalDu: 0, totalPaye: 0, solde: 0 },
      cdf: scolaireEntry?.cdf ?? { totalDu: 0, totalPaye: 0, solde: 0 },
    },
    autres,
    details,
  }
}
