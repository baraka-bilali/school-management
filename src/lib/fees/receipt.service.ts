import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { toDisplayCode } from "@/lib/student-fields"

/**
 * Génère un numéro de reçu séquentiel au format REC-ANNEE-0001
 * en utilisant une transaction avec verrouillage optimiste via le modèle ReceiptCounter.
 *
 * @returns Le numéro de reçu et la valeur du compteur
 */
export async function generateReceiptNumber(
  tx: Prisma.TransactionClient,
  schoolId: number,
  yearId: number,
  yearName: string
): Promise<string> {
  // Upsert atomique : crée le compteur s'il n'existe pas, sinon incrémente
  const counter = await tx.receiptCounter.upsert({
    where: {
      schoolId_yearId: { schoolId, yearId },
    },
    update: {
      counter: { increment: 1 },
    },
    create: {
      schoolId,
      yearId,
      counter: 1,
    },
  })

  // Extraire l'année du nom (ex: "2025-2026" → "2526")
  const yearCode = yearName.includes("-")
    ? yearName.split("-").map((y) => y.slice(-2)).join("")
    : yearName.slice(-4)

  const paddedCounter = String(counter.counter).padStart(4, "0")
  return `REC-${yearCode}-${paddedCounter}`
}

/**
 * Génère le contenu PDF du reçu de paiement.
 * Retourne le chemin du fichier PDF sauvegardé.
 *
 * NOTE : Cette implémentation génère un reçu textuel simple.
 * Pour une solution production avec mise en page riche,
 * intégrer une librairie comme pdfkit, puppeteer ou jsPDF.
 */
export async function generateReceiptPdf(paiementId: number): Promise<string> {
  const paiement = await prisma.paiement.findUnique({
    where: { id: paiementId },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          middleName: true,
          code: true,
        },
      },
      tarification: {
        include: {
          typeFrais: { select: { nom: true } },
          year: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      enrollment: {
        include: {
          class: { select: { name: true } },
        },
      },
    },
  })

  if (!paiement) {
    throw new Error(`Paiement #${paiementId} introuvable`)
  }

  // Chemin de sauvegarde du reçu
  const fileName = `${paiement.numeroRecu}.pdf`
  const filePath = `/receipts/${paiement.schoolId}/${fileName}`

  // TODO: Implémenter la génération PDF réelle avec pdfkit/puppeteer
  // Pour l'instant, on retourne le chemin prévu
  // Le frontend pourra générer le PDF côté client si nécessaire
  console.log(`[Receipt] PDF path reserved: ${filePath}`)

  return filePath
}

/**
 * Données structurées pour le reçu (utilisables côté client pour PDF).
 */
export async function getReceiptData(paiementId: number) {
  const paiement = await prisma.paiement.findUnique({
    where: { id: paiementId },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          middleName: true,
          code: true,
        },
      },
      tarification: {
        include: {
          typeFrais: { select: { nom: true, code: true } },
          year: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      enrollment: {
        include: {
          class: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!paiement) {
    throw new Error(`Paiement #${paiementId} introuvable`)
  }

  const school = await prisma.school.findUnique({
    where: { id: paiement.schoolId },
    select: {
      nomEtablissement: true,
      adresse: true,
      ville: true,
      telephone: true,
      email: true,
      logoUrl: true,
      sealUrl: true,
      profilePhotoUrl: true,
    },
  })

  return {
    numeroRecu: paiement.numeroRecu,
    datePaiement: paiement.datePaiement,
    montant: paiement.montant,
    devise: paiement.tarification.devise,
    modePaiement: paiement.modePaiement,
    reference: paiement.reference,
    eleve: {
      code: toDisplayCode(paiement.student.code, paiement.enrollment.class.id, paiement.enrollment.yearId),
      nom: `${paiement.student.lastName} ${paiement.student.middleName} ${paiement.student.firstName}`,
    },
    classe: paiement.enrollment.class.name,
    typeFrais: paiement.tarification.typeFrais.nom,
    anneeScolaire: paiement.tarification.year.name,
    notes: paiement.notes,
    isAnnule: paiement.isAnnule,
    schoolName: school?.nomEtablissement ?? "",
    schoolAddress: [school?.adresse, school?.ville].filter(Boolean).join(", ") || null,
    schoolPhone: school?.telephone ?? null,
    schoolEmail: school?.email ?? null,
    logoUrl: school?.logoUrl ?? null,
    sealUrl: school?.sealUrl ?? null,
  }
}
