import { prisma } from "@/lib/prisma"
import { newSubscriptionPeriod } from "@/lib/subscription-period"

/** Plan unique — plus de distinction Starter / Pro / Premium. */
export const SCHOOL_PLAN = "STANDARD" as const
export const SCHOOL_PLAN_LABEL = "Kelasi 360"

export const WELCOME_MONTH_DAYS = 30

export function formatSchoolPlanLabel(plan?: string | null): string {
  if (!plan) return "Non défini"
  const value = plan.toUpperCase()
  if (
    value === "STANDARD" ||
    value === "BASIC" ||
    value === "STARTER" ||
    value === "PREMIUM" ||
    value === "PRO" ||
    value === "ENTERPRISE" ||
    value === "KELASI360"
  ) {
    return SCHOOL_PLAN_LABEL
  }
  return plan
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SubscriptionInvoiceCounter" (
      "id"        SERIAL PRIMARY KEY,
      "year"      INTEGER NOT NULL UNIQUE,
      "counter"   INTEGER NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `

  const rows = await prisma.$queryRaw<[{ counter: number }]>`
    INSERT INTO "SubscriptionInvoiceCounter" ("year", "counter", "updatedAt")
    VALUES (${year}, 1, NOW())
    ON CONFLICT ("year") DO UPDATE
      SET "counter"   = "SubscriptionInvoiceCounter"."counter" + 1,
          "updatedAt" = NOW()
    RETURNING "counter"
  `

  const counter = rows[0]?.counter ?? 1
  return `FAC-${year}-${String(counter).padStart(4, "0")}`
}

/**
 * Premier mois offert : quand l'école ouvre son espace pour la 1ʳᵉ fois
 * (compte encore EN_ATTENTE, sans abonnement ni paiement).
 */
export async function grantWelcomeMonthIfEligible(schoolId: number): Promise<{
  granted: boolean
  dateFinAbonnement?: Date
  numeroFacture?: string
}> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      etatCompte: true,
      dateDebutAbonnement: true,
      dateFinAbonnement: true,
      nomEtablissement: true,
      _count: { select: { subscriptionPayments: true } },
    },
  })

  if (!school) return { granted: false }

  const alreadyActivated =
    school.etatCompte === "ACTIF" ||
    school.etatCompte === "SUSPENDU" ||
    school.dateFinAbonnement != null ||
    school.dateDebutAbonnement != null ||
    school._count.subscriptionPayments > 0

  if (alreadyActivated) return { granted: false }
  if (school.etatCompte !== "EN_ATTENTE") return { granted: false }

  const { startDate, endDate } = newSubscriptionPeriod(new Date(), WELCOME_MONTH_DAYS)
  const numeroFacture = await nextInvoiceNumber()

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.school.updateMany({
        where: {
          id: schoolId,
          etatCompte: "EN_ATTENTE",
          dateFinAbonnement: null,
          dateDebutAbonnement: null,
        },
        data: {
          etatCompte: "ACTIF",
          dateDebutAbonnement: startDate,
          dateFinAbonnement: endDate,
          periodeAbonnement: "MENSUEL",
          planAbonnement: SCHOOL_PLAN,
          typePaiement: "OFFERT",
          montantPaye: 0,
        },
      })

      // Course condition : une autre requête a déjà activé l'école
      if (updated.count === 0) return

      await tx.subscriptionPayment.create({
        data: {
          schoolId,
          montant: 0,
          devise: "USD",
          typePaiement: "OFFERT",
          reference: null,
          dateDebut: startDate,
          dateFin: endDate,
          periode: "MENSUEL",
          plan: SCHOOL_PLAN,
          numeroFacture,
          notes: "Mois d'essai offert à l'ouverture de l'espace",
          statut: "ACTIF",
          createdById: null,
        },
      })

      await tx.notification.create({
        data: {
          type: "SUBSCRIPTION_PAYMENT_RECEIVED",
          message: `🎁 Votre premier mois est offert ! Accès actif jusqu'au ${endDate.toLocaleDateString("fr-FR")}.`,
          schoolId,
          userId: null,
          targetRole: "SCHOOL_USER_ONLY",
        },
      })
    })
  } catch (error) {
    console.error("[welcome-month] Échec attribution:", error)
    return { granted: false }
  }

  const refreshed = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { etatCompte: true, dateFinAbonnement: true },
  })

  if (refreshed?.etatCompte !== "ACTIF" || !refreshed.dateFinAbonnement) {
    return { granted: false }
  }

  return {
    granted: true,
    dateFinAbonnement: refreshed.dateFinAbonnement,
    numeroFacture,
  }
}
