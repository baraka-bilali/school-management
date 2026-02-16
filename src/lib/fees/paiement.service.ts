import { prisma } from "@/lib/prisma"
import { Prisma, ModePaiement } from "@prisma/client"
import { generateReceiptNumber, generateReceiptPdf } from "./receipt.service"
import { calculateBalance } from "./balance.service"
import type { CreatePaiementInput, UpdatePaiementInput } from "./validation"

// ============================================================
// ERREURS MÉTIER
// ============================================================

export class FeeError extends Error {
  public code: string
  public statusCode: number

  constructor(message: string, code: string, statusCode = 400) {
    super(message)
    this.name = "FeeError"
    this.code = code
    this.statusCode = statusCode
  }
}

// ============================================================
// CRÉATION PAIEMENT
// ============================================================

interface CreatePaiementOptions extends CreatePaiementInput {
  schoolId: number
  createdBy: number
}

export async function createPaiement(options: CreatePaiementOptions) {
  const {
    enrollmentId,
    tarificationId,
    montant,
    datePaiement,
    modePaiement,
    reference,
    notes,
    schoolId,
    createdBy,
  } = options

  // Toute l'opération dans une transaction sérialisable
  return await prisma.$transaction(
    async (tx) => {
      // 1. Vérifier que l'inscription existe et est active
      const enrollment = await tx.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          year: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
      })

      if (!enrollment) {
        throw new FeeError(
          "Inscription introuvable",
          "ENROLLMENT_NOT_FOUND",
          404
        )
      }

      if (enrollment.status !== "ACTIVE") {
        throw new FeeError(
          "L'élève n'a pas une inscription active",
          "ENROLLMENT_INACTIVE"
        )
      }

      // 2. Vérifier que la tarification existe et appartient à la même école
      const tarification = await tx.tarification.findUnique({
        where: { id: tarificationId },
        include: { typeFrais: { select: { nom: true } } },
      })

      if (!tarification) {
        throw new FeeError(
          "Tarification introuvable",
          "TARIFICATION_NOT_FOUND",
          404
        )
      }

      if (tarification.schoolId !== schoolId) {
        throw new FeeError(
          "Tarification non accessible pour cette école",
          "TARIFICATION_WRONG_SCHOOL",
          403
        )
      }

      if (!tarification.isActive) {
        throw new FeeError(
          "Cette tarification n'est plus active",
          "TARIFICATION_INACTIVE"
        )
      }

      // 3. Vérifier que la tarification s'applique à la même année scolaire
      if (tarification.yearId !== enrollment.yearId) {
        throw new FeeError(
          "La tarification ne correspond pas à l'année scolaire de l'inscription",
          "YEAR_MISMATCH"
        )
      }

      // 4. Vérifier que la tarification s'applique à la classe (si spécifique)
      if (tarification.classId && tarification.classId !== enrollment.classId) {
        throw new FeeError(
          "La tarification ne s'applique pas à la classe de l'élève",
          "CLASS_MISMATCH"
        )
      }

      // 5. Vérifier le montant (ne pas dépasser le solde restant)
      const paidAggregate = await tx.paiement.aggregate({
        where: {
          studentId: enrollment.studentId,
          tarificationId,
          isAnnule: false,
        },
        _sum: { montant: true },
      })

      const totalPaye = paidAggregate._sum.montant ?? 0
      const soldeRestant = tarification.montant - totalPaye

      if (montant > soldeRestant) {
        throw new FeeError(
          `Le montant (${montant}) dépasse le solde restant (${soldeRestant})`,
          "MONTANT_EXCEEDS_BALANCE"
        )
      }

      // 6. Générer le numéro de reçu séquentiel (verrouillé)
      const numeroRecu = await generateReceiptNumber(
        tx,
        schoolId,
        enrollment.yearId,
        enrollment.year.name
      )

      // 7. Créer le paiement
      const paiement = await tx.paiement.create({
        data: {
          numeroRecu,
          enrollmentId,
          studentId: enrollment.studentId,
          tarificationId,
          montant,
          datePaiement: datePaiement ? new Date(datePaiement) : new Date(),
          modePaiement: (modePaiement as ModePaiement) || "CASH",
          reference: reference || null,
          notes: notes || null,
          schoolId,
          createdBy,
        },
        include: {
          student: {
            select: { firstName: true, lastName: true, middleName: true, code: true },
          },
          tarification: {
            include: {
              typeFrais: { select: { nom: true } },
              year: { select: { name: true } },
            },
          },
          enrollment: {
            include: { class: { select: { name: true } } },
          },
        },
      })

      return paiement
    },
    {
      maxWait: 10000,
      timeout: 30000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}

// ============================================================
// MODIFICATION PAIEMENT (SANS SUPPRESSION)
// ============================================================

interface UpdatePaiementOptions extends UpdatePaiementInput {
  paiementId: number
  modifiePar: number
  schoolId: number
}

export async function updatePaiement(options: UpdatePaiementOptions) {
  const { paiementId, modifiePar, schoolId, motif, ...updates } = options

  return await prisma.$transaction(
    async (tx) => {
      // 1. Vérifier que le paiement existe
      const paiement = await tx.paiement.findUnique({
        where: { id: paiementId },
      })

      if (!paiement) {
        throw new FeeError("Paiement introuvable", "PAIEMENT_NOT_FOUND", 404)
      }

      if (paiement.schoolId !== schoolId) {
        throw new FeeError(
          "Paiement non accessible pour cette école",
          "PAIEMENT_WRONG_SCHOOL",
          403
        )
      }

      if (paiement.isAnnule) {
        throw new FeeError(
          "Impossible de modifier un paiement annulé",
          "PAIEMENT_ANNULE"
        )
      }

      // 2. Enregistrer chaque champ modifié dans PaiementModification
      const modifications: Array<{
        paiementId: number
        champModifie: string
        ancienneValeur: string
        nouvelleValeur: string
        modifiePar: number
        motif: string | null
      }> = []

      const dataToUpdate: Record<string, unknown> = {}

      if (updates.montant !== undefined && updates.montant !== paiement.montant) {
        // Vérifier que le nouveau montant ne dépasse pas le solde
        const paidAggregate = await tx.paiement.aggregate({
          where: {
            studentId: paiement.studentId,
            tarificationId: paiement.tarificationId,
            isAnnule: false,
            id: { not: paiementId }, // Exclure le paiement en cours de modification
          },
          _sum: { montant: true },
        })

        const tarification = await tx.tarification.findUnique({
          where: { id: paiement.tarificationId },
        })

        if (tarification) {
          const autresPaiements = paidAggregate._sum.montant ?? 0
          const soldeDisponible = tarification.montant - autresPaiements

          if (updates.montant > soldeDisponible) {
            throw new FeeError(
              `Le nouveau montant (${updates.montant}) dépasse le solde disponible (${soldeDisponible})`,
              "MONTANT_EXCEEDS_BALANCE"
            )
          }
        }

        modifications.push({
          paiementId,
          champModifie: "montant",
          ancienneValeur: String(paiement.montant),
          nouvelleValeur: String(updates.montant),
          modifiePar,
          motif: motif || null,
        })
        dataToUpdate.montant = updates.montant
      }

      if (updates.datePaiement !== undefined) {
        const newDate = new Date(updates.datePaiement)
        modifications.push({
          paiementId,
          champModifie: "datePaiement",
          ancienneValeur: paiement.datePaiement.toISOString(),
          nouvelleValeur: newDate.toISOString(),
          modifiePar,
          motif: motif || null,
        })
        dataToUpdate.datePaiement = newDate
      }

      if (updates.modePaiement !== undefined && updates.modePaiement !== paiement.modePaiement) {
        modifications.push({
          paiementId,
          champModifie: "modePaiement",
          ancienneValeur: paiement.modePaiement,
          nouvelleValeur: updates.modePaiement,
          modifiePar,
          motif: motif || null,
        })
        dataToUpdate.modePaiement = updates.modePaiement as ModePaiement
      }

      if (updates.reference !== undefined && updates.reference !== paiement.reference) {
        modifications.push({
          paiementId,
          champModifie: "reference",
          ancienneValeur: paiement.reference || "",
          nouvelleValeur: updates.reference || "",
          modifiePar,
          motif: motif || null,
        })
        dataToUpdate.reference = updates.reference
      }

      if (updates.notes !== undefined && updates.notes !== paiement.notes) {
        modifications.push({
          paiementId,
          champModifie: "notes",
          ancienneValeur: paiement.notes || "",
          nouvelleValeur: updates.notes || "",
          modifiePar,
          motif: motif || null,
        })
        dataToUpdate.notes = updates.notes
      }

      if (modifications.length === 0) {
        throw new FeeError("Aucune modification détectée", "NO_CHANGES")
      }

      // 3. Enregistrer les modifications
      await tx.paiementModification.createMany({ data: modifications })

      // 4. Mettre à jour le paiement
      const updatedPaiement = await tx.paiement.update({
        where: { id: paiementId },
        data: dataToUpdate,
        include: {
          student: {
            select: { firstName: true, lastName: true, middleName: true, code: true },
          },
          tarification: {
            include: {
              typeFrais: { select: { nom: true } },
              year: { select: { name: true } },
            },
          },
          enrollment: {
            include: { class: { select: { name: true } } },
          },
          modifications: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      })

      return updatedPaiement
    },
    {
      maxWait: 10000,
      timeout: 30000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}

// ============================================================
// ANNULATION PAIEMENT (SOFT DELETE)
// ============================================================

export async function annulerPaiement(
  paiementId: number,
  motifAnnulation: string,
  annulePar: number,
  schoolId: number
) {
  return await prisma.$transaction(async (tx) => {
    const paiement = await tx.paiement.findUnique({
      where: { id: paiementId },
    })

    if (!paiement) {
      throw new FeeError("Paiement introuvable", "PAIEMENT_NOT_FOUND", 404)
    }

    if (paiement.schoolId !== schoolId) {
      throw new FeeError(
        "Paiement non accessible pour cette école",
        "PAIEMENT_WRONG_SCHOOL",
        403
      )
    }

    if (paiement.isAnnule) {
      throw new FeeError(
        "Ce paiement est déjà annulé",
        "PAIEMENT_ALREADY_ANNULE"
      )
    }

    // Enregistrer l'annulation comme modification
    await tx.paiementModification.create({
      data: {
        paiementId,
        champModifie: "isAnnule",
        ancienneValeur: "false",
        nouvelleValeur: "true",
        modifiePar: annulePar,
        motif: motifAnnulation,
      },
    })

    const updatedPaiement = await tx.paiement.update({
      where: { id: paiementId },
      data: {
        isAnnule: true,
        motifAnnulation,
        annulePar,
        dateAnnulation: new Date(),
      },
      include: {
        student: {
          select: { firstName: true, lastName: true, code: true },
        },
        tarification: {
          include: { typeFrais: { select: { nom: true } } },
        },
      },
    })

    return updatedPaiement
  })
}

// ============================================================
// LECTURE
// ============================================================

export async function getPaiementById(paiementId: number, schoolId: number) {
  const paiement = await prisma.paiement.findUnique({
    where: { id: paiementId },
    include: {
      student: {
        select: { firstName: true, lastName: true, middleName: true, code: true },
      },
      tarification: {
        include: {
          typeFrais: { select: { nom: true, code: true } },
          year: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      enrollment: {
        include: { class: { select: { name: true } } },
      },
      modifications: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!paiement) {
    throw new FeeError("Paiement introuvable", "PAIEMENT_NOT_FOUND", 404)
  }

  if (paiement.schoolId !== schoolId) {
    throw new FeeError("Accès refusé", "PAIEMENT_WRONG_SCHOOL", 403)
  }

  return paiement
}

interface ListPaiementsFilters {
  schoolId: number
  studentId?: number
  yearId?: number
  classId?: number
  tarificationId?: number
  isAnnule?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export async function listPaiements(filters: ListPaiementsFilters) {
  const {
    schoolId,
    studentId,
    yearId,
    classId,
    tarificationId,
    isAnnule,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
  } = filters

  const where: Prisma.PaiementWhereInput = { schoolId }

  if (studentId) where.studentId = studentId
  if (tarificationId) where.tarificationId = tarificationId
  if (isAnnule !== undefined) where.isAnnule = isAnnule
  if (yearId) {
    where.tarification = { yearId }
  }
  if (classId) {
    where.enrollment = { classId }
  }
  if (dateFrom || dateTo) {
    where.datePaiement = {}
    if (dateFrom) where.datePaiement.gte = new Date(dateFrom)
    if (dateTo) where.datePaiement.lte = new Date(dateTo)
  }

  const [paiements, total] = await Promise.all([
    prisma.paiement.findMany({
      where,
      include: {
        student: {
          select: { firstName: true, lastName: true, middleName: true, code: true },
        },
        tarification: {
          include: {
            typeFrais: { select: { nom: true, code: true } },
            year: { select: { name: true } },
          },
        },
        enrollment: {
          include: { class: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.paiement.count({ where }),
  ])

  return {
    data: paiements,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}
