import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase-server"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

async function generateExpirationNotifications() {
  try {
    const now = new Date()

    const schools = await prisma.school.findMany({
      where: {
        etatCompte: "ACTIF",
        dateFinAbonnement: { not: null },
      },
    })

    const notificationsCreated = []

    for (const school of schools) {
      if (!school.dateFinAbonnement) continue

      const endDate = new Date(school.dateFinAbonnement)
      const diffTime = endDate.getTime() - now.getTime()
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const thresholds = [
        { days: 15, type: "SUBSCRIPTION_EXPIRING_15_DAYS" },
        { days: 10, type: "SUBSCRIPTION_EXPIRING_10_DAYS" },
        { days: 5, type: "SUBSCRIPTION_EXPIRING_5_DAYS" },
        { days: 2, type: "SUBSCRIPTION_EXPIRING_2_DAYS" },
        { days: 1, type: "SUBSCRIPTION_EXPIRING_1_DAY" },
        { days: 0, type: "SUBSCRIPTION_EXPIRED" },
      ]

      for (const threshold of thresholds) {
        const isInThreshold =
          (threshold.days === 0 && daysLeft <= 0) ||
          daysLeft === threshold.days

        if (isInThreshold) {
          const existingNotification = await prisma.notification.findFirst({
            where: {
              schoolId: school.id,
              type: threshold.type as any,
              createdAt: {
                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
              },
            },
          })

          if (!existingNotification) {
            // Message Super Admin : observe les écoles
            const superAdminMessage =
              threshold.days === 0
                ? `⚠️ L'abonnement de l'école "${school.nomEtablissement}" a expiré. Suspension automatique du compte.`
                : threshold.days === 1
                ? `🔔 L'abonnement de l'école "${school.nomEtablissement}" expire dans 1 jour.`
                : `🔔 L'abonnement de l'école "${school.nomEtablissement}" expire dans ${threshold.days} jours.`

            await prisma.notification.create({
              data: {
                type: threshold.type as any,
                message: superAdminMessage,
                schoolId: school.id,
                userId: null,
                targetRole: "SUPER_ADMIN_ONLY" as any,
                daysLeft: Math.max(0, daysLeft),
              },
            })

            // Broadcast Realtime → tous les Super Admins connectés
            await supabaseAdmin.channel("notifications:super-admin").send({
              type: "broadcast",
              event: "new_notification",
              payload: {
                schoolName: school.nomEtablissement,
                type: threshold.type,
                daysLeft: Math.max(0, daysLeft),
              },
            })

            // Message Admin école : reçoit l'alerte sur son propre abonnement
            const schoolAdminMessage =
              threshold.days === 0
                ? `⚠️ Votre abonnement a expiré. Votre compte a été suspendu. Veuillez contacter l'administration pour renouveler.`
                : threshold.days === 1
                ? `🔔 Votre abonnement expire demain. Pensez à le renouveler pour éviter une interruption.`
                : `🔔 Votre abonnement expire dans ${threshold.days} jours. N'oubliez pas de le renouveler.`

            await prisma.notification.create({
              data: {
                type: threshold.type as any,
                message: schoolAdminMessage,
                schoolId: school.id,
                userId: school.creeParId,
                targetRole: "SCHOOL_USER_ONLY" as any,
                daysLeft: Math.max(0, daysLeft),
              },
            })

            // Broadcast Realtime → l'admin de l'école spécifique
            if (school.creeParId) {
              await supabaseAdmin
                .channel(`notifications:user:${school.creeParId}`)
                .send({
                  type: "broadcast",
                  event: "new_notification",
                  payload: {
                    type: threshold.type,
                    daysLeft: Math.max(0, daysLeft),
                  },
                })
            }

            notificationsCreated.push({
              school: school.nomEtablissement,
              type: threshold.type,
              daysLeft: Math.max(0, daysLeft),
            })
          }
        }
      }

      // Suspendre automatiquement les écoles expirées
      if (daysLeft <= 0 && school.etatCompte === "ACTIF") {
        await prisma.school.update({
          where: { id: school.id },
          data: { etatCompte: "SUSPENDU" },
        })
      }
    }

    return notificationsCreated
  } catch (error) {
    console.error("❌ Erreur lors de la génération des notifications:", error)
    throw error
  }
}

// POST /api/notifications/check
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "COMPTABLE", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"]

    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: true, message: "Vérification effectuée" })
    }

    const notifications = await generateExpirationNotifications()

    return NextResponse.json({
      success: true,
      notificationsCreated: notifications.length,
      details: notifications,
    })
  } catch (error) {
    console.error("❌ Erreur lors de la vérification des notifications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// GET /api/notifications/check — cron job externe
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET || "your-cron-secret"

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const notifications = await generateExpirationNotifications()

    return NextResponse.json({
      success: true,
      notificationsCreated: notifications.length,
      details: notifications,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erreur lors de la vérification automatique:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
