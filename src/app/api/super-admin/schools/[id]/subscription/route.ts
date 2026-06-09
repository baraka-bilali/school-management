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

  // Auto-création de la table si elle n'existe pas encore en production
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SubscriptionInvoiceCounter" (
      "id"        SERIAL PRIMARY KEY,
      "year"      INTEGER NOT NULL UNIQUE,
      "counter"   INTEGER NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `

  // INSERT ou INCREMENT via SQL brut — fonctionne indépendamment du client Prisma généré
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

// PUT: Activer / renouveler l'abonnement d'une école
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
    const {
      dateDebutAbonnement,
      dateFinAbonnement,
      periodeAbonnement,
      planAbonnement,
      typePaiement,
      montantPaye,
      notes,
      reference,
    } = body

    const startDate = dateDebutAbonnement ? new Date(dateDebutAbonnement) : new Date()
    startDate.setHours(0, 0, 0, 0)

    let endDate: Date
    if (dateFinAbonnement) {
      endDate = new Date(dateFinAbonnement)
      endDate.setHours(23, 59, 59, 999)
    } else {
      endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setHours(23, 59, 59, 999)
    }

    const periode = periodeAbonnement || "MENSUEL"
    const plan = planAbonnement || "BASIC"
    const montant = montantPaye != null ? parseFloat(String(montantPaye)) : 70
    const devise = "USD"

    const numeroFacture = await generateInvoiceNumber()

    const [updatedSchool, payment] = await prisma.$transaction([
      prisma.school.update({
        where: { id: schoolId },
        data: {
          dateDebutAbonnement: startDate,
          dateFinAbonnement: endDate,
          periodeAbonnement: periode,
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
          periode,
          plan,
          numeroFacture,
          notes: notes || null,
          statut: "ACTIF",
          createdById: user.id || null,
        },
      }),
    ])

    // Notification pour tous les admins de l'école (broadcast via schoolId)
    const schoolAdminMessage = `✅ Votre abonnement a été activé. Facture n° ${numeroFacture} — ${montant} ${devise}. Valable jusqu'au ${endDate.toLocaleDateString("fr-FR")}.`

    await prisma.notification.create({
      data: {
        type: "SUBSCRIPTION_PAYMENT_RECEIVED",
        message: schoolAdminMessage,
        schoolId,
        userId: null,
        targetRole: "SCHOOL_USER_ONLY",
      },
    })

    // Notification pour le super-admin
    await prisma.notification.create({
      data: {
        type: "SUBSCRIPTION_PAYMENT_RECEIVED",
        message: `💳 Paiement enregistré pour l'école "${existingSchool.nomEtablissement}" — Facture ${numeroFacture} — ${montant} ${devise}.`,
        schoolId,
        userId: null,
        targetRole: "SUPER_ADMIN_ONLY",
      },
    })

    // Push Realtime → tous les admins de l'école
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
          payload: {
            type: "SUBSCRIPTION_PAYMENT_RECEIVED",
            numeroFacture,
            montant,
            devise,
          },
        })
    }

    // Push Realtime → super-admin
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
      message: `Abonnement activé jusqu'au ${endDate.toLocaleDateString("fr-FR")} — Facture ${numeroFacture}`,
    })
  } catch (e: any) {
    console.error("Erreur abonnement:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
