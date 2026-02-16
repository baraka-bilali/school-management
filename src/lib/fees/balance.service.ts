import { prisma } from "@/lib/prisma"

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
}> {
  const tarification = await prisma.tarification.findUnique({
    where: { id: tarificationId },
    select: { montant: true },
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
  }
}

/**
 * Calcul du solde global d'un élève pour toutes les tarifications
 * d'une année scolaire donnée.
 */
export async function calculateStudentYearBalance(
  studentId: number,
  yearId: number,
  schoolId: number
): Promise<{
  totalDu: number
  totalPaye: number
  soldeGlobal: number
  details: Array<{
    tarificationId: number
    typeFrais: string
    montantTotal: number
    totalPaye: number
    solde: number
  }>
}> {
  // Trouver toutes les tarifications applicables à cet élève
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
        { classId: null },                      // Tarifications globales
        { classId: enrollment.classId },         // Tarifications spécifiques à la classe
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
      }
    })
  )

  const totalDu = details.reduce((acc, d) => acc + d.montantTotal, 0)
  const totalPaye = details.reduce((acc, d) => acc + d.totalPaye, 0)

  return {
    totalDu,
    totalPaye,
    soldeGlobal: totalDu - totalPaye,
    details,
  }
}
