import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase-server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

async function requireSuperAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("Cookie") || req.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/)
  if (!match) return null
  try {
    const decoded = jwt.verify(match[1], JWT_SECRET) as any
    return decoded.role === "SUPER_ADMIN" ? decoded : null
  } catch {
    return null
  }
}

async function generateInvoiceNumber(): Promise<string> {
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

// Calcule les dates de début et de fin selon l'état actuel de l'abonnement
// - Si actif avec dateFinAbonnement dans le futur : prolonge à partir de la fin actuelle
// - Sinon : commence aujourd'hui
function calculateSubscriptionDates(school: {
  etatCompte: string
  dateFinAbonnement: Date | null
}): { startDate: Date; endDate: Date } {
  const now = new Date()
  const isActive =
    school.etatCompte === "ACTIF" &&
    school.dateFinAbonnement !== null &&
    new Date(school.dateFinAbonnement) > now

  let startDate: Date
  if (isActive) {
    // Prolongation : nouveau mois commence à la fin de l'abonnement en cours
    startDate = new Date(school.dateFinAbonnement!)
    startDate.setHours(0, 0, 0, 0)
  } else {
    // Nouvelle activation : commence aujourd'hui
    startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
  }

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 30)
  endDate.setHours(23, 59, 59, 999)

  return { startDate, endDate }
}

// PUT: Activer / prolonger l'abonnement d'une école (toujours 30 jours)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { id } = await context.params
    const schoolId = parseInt(id)
    if (isNaN(schoolId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 })

    const existingSchool = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!existingSchool) return NextResponse.json({ error: "École non trouvée" }, { status: 404 })

    const body = await req.json()
    const { planAbonnement, typePaiement, montantPaye, notes, reference } = body

    // Dates auto-calculées — toujours 30 jours, prolongement si déjà actif
    const { startDate, endDate } = calculateSubscriptionDates(existingSchool)

    const plan = planAbonnement || "STARTER"
    const montant = montantPaye != null ? parseFloat(String(montantPaye)) : 70
    const devise = "USD"

    const numeroFacture = await generateInvoiceNumber()

    const [updatedSchool, payment] = await prisma.$transaction([
      prisma.school.update({
        where: { id: schoolId },
        data: {
          dateDebutAbonnement: startDate,
          dateFinAbonnement: endDate,
          periodeAbonnement: "MENSUEL",
          planAbonnement: plan,
          typePaiement: typePaiement || "MOBILE_MONEY",
          montantPaye: montant,
          etatCompte: "ACTIF",
        },
        select: {
          id: true,
          nomEtablissement: true,
          etatCompte: true,
          dateDebutAbonnement: true,
          dateFinAbonnement: true,
          periodeAbonnement: true,
          planAbonnement: true,
          typePaiement: true,
          montantPaye: true,
          creeParId: true,
        },
      }),
      prisma.subscriptionPayment.create({
        data: {
          schoolId,
          montant,
          devise,
          typePaiement: typePaiement || "MOBILE_MONEY",
          reference: reference || null,
          dateDebut: startDate,
          dateFin: endDate,
          periode: "MENSUEL",
          plan,
          numeroFacture,
          notes: notes || null,
          statut: "ACTIF",
          createdById: user.id || null,
        },
      }),
    ])

    const isExtension = existingSchool.etatCompte === "ACTIF" &&
      existingSchool.dateFinAbonnement !== null &&
      new Date(existingSchool.dateFinAbonnement) > new Date()

    const actionLabel = isExtension ? "prolongé" : "activé"
    const schoolAdminMessage = `✅ Votre abonnement a été ${actionLabel}. Facture n° ${numeroFacture} — ${montant} ${devise}. Valable jusqu'au ${endDate.toLocaleDateString("fr-FR")}.`

    await prisma.notification.create({
      data: {
        type: "SUBSCRIPTION_PAYMENT_RECEIVED",
        message: schoolAdminMessage,
        schoolId,
        userId: null,
        targetRole: "SCHOOL_USER_ONLY",
      },
    })

    await prisma.notification.create({
      data: {
        type: "SUBSCRIPTION_PAYMENT_RECEIVED",
        message: `💳 Paiement enregistré pour l'école "${existingSchool.nomEtablissement}" — Facture ${numeroFacture} — ${montant} ${devise}.`,
        schoolId,
        userId: null,
        targetRole: "SUPER_ADMIN_ONLY",
      },
    })

    const adminUsers = await prisma.user.findMany({
      where: { schoolId, role: "ADMIN", isActive: true },
      select: { id: true },
    })
    for (const admin of adminUsers) {
      await supabaseAdmin
        .channel(`notifications:user:${admin.id}`)
        .send({
          type: "broadcast",
          event: "new_notification",
          payload: { type: "SUBSCRIPTION_PAYMENT_RECEIVED", numeroFacture, montant, devise },
        })
    }

    await supabaseAdmin.channel("notifications:super-admin").send({
      type: "broadcast",
      event: "new_notification",
      payload: {
        type: "SUBSCRIPTION_PAYMENT_RECEIVED",
        schoolName: existingSchool.nomEtablissement,
        numeroFacture,
        montant,
      },
    })

    return NextResponse.json({
      success: true,
      school: updatedSchool,
      payment,
      numeroFacture,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isExtension,
      message: `Abonnement ${actionLabel} jusqu'au ${endDate.toLocaleDateString("fr-FR")} — Facture ${numeroFacture}`,
    })
  } catch (e: any) {
    console.error("Erreur abonnement:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
