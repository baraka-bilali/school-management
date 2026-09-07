import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import {
  getSubscriptionDaysLeft,
  isSubscriptionAccessBlocked,
} from "@/lib/subscription-period"

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

      const daysLeft = getSubscriptionDaysLeft(school.dateFinAbonnement, now)
      const accessBlocked = isSubscriptionAccessBlocked(
        school.dateFinAbonnement,
        school.etatCompte,
        now
      )

      const thresholds = [
        { days: 15, type: "SUBSCRIPTION_EXPIRING_15_DAYS" },
        { days: 10, type: "SUBSCRIPTION_EXPIRING_10_DAYS" },
        { days: 5, type: "SUBSCRIPTION_EXPIRING_5_DAYS" },
        { days: 2, type: "SUBSCRIPTION_EXPIRING_2_DAYS" },
        { days: 1, type: "SUBSCRIPTION_EXPIRING_1_DAY" },
      ]

      for (const threshold of thresholds) {
        if (daysLeft !== threshold.days) continue

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
          const superAdminMessage =
            threshold.days === 1
              ? `🔔 L'abonnement de l'école "${school.nomEtablissement}" expire dans 1 jour.`
              : `🔔 L'abonnement de l'école "${school.nomEtablissement}" expire dans ${threshold.days} jours.`

          await prisma.notification.create({
            data: {
              type: threshold.type as any,
              message: superAdminMessage,
              schoolId: school.id,
              userId: null,
              targetRole: "SUPER_ADMIN_ONLY" as any,
              daysLeft: Math.max(0, daysLeft ?? 0),
            },
          })

          await getSupabaseAdmin().channel("notifications:super-admin").send({
            type: "broadcast",
            event: "new_notification",
            payload: {
              schoolName: school.nomEtablissement,
              type: threshold.type,
              daysLeft: Math.max(0, daysLeft ?? 0),
            },
          })

          const schoolAdminMessage =
            threshold.days === 1
              ? `🔔 Votre abonnement expire demain. Pensez à le renouveler pour éviter une interruption.`
              : `🔔 Votre abonnement expire dans ${threshold.days} jours. N'oubliez pas de le renouveler.`

          await prisma.notification.create({
            data: {
              type: threshold.type as any,
              message: schoolAdminMessage,
              schoolId: school.id,
              userId: school.creeParId,
              targetRole: "SCHOOL_USER_ONLY" as any,
              daysLeft: Math.max(0, daysLeft ?? 0),
            },
          })

          if (school.creeParId) {
            await getSupabaseAdmin()
              .channel(`notifications:user:${school.creeParId}`)
              .send({
                type: "broadcast",
                event: "new_notification",
                payload: {
                  type: threshold.type,
                  daysLeft: Math.max(0, daysLeft ?? 0),
                },
              })
          }

          notificationsCreated.push({
            school: school.nomEtablissement,
            type: threshold.type,
            daysLeft: Math.max(0, daysLeft ?? 0),
          })
        }
      }

      // Expiré uniquement après le jour civil de fin (accès valable toute la journée d'expiration)
      if (accessBlocked && school.etatCompte === "ACTIF") {
        const existingExpired = await prisma.notification.findFirst({
          where: {
            schoolId: school.id,
            type: "SUBSCRIPTION_EXPIRED" as any,
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        })

        if (!existingExpired) {
          await prisma.notification.create({
            data: {
              type: "SUBSCRIPTION_EXPIRED" as any,
              message: `⚠️ L'abonnement de l'école "${school.nomEtablissement}" a expiré. Suspension automatique du compte.`,
              schoolId: school.id,
              userId: null,
              targetRole: "SUPER_ADMIN_ONLY" as any,
              daysLeft: 0,
            },
          })

          await getSupabaseAdmin().channel("notifications:super-admin").send({
            type: "broadcast",
            event: "new_notification",
            payload: {
              schoolName: school.nomEtablissement,
              type: "SUBSCRIPTION_EXPIRED",
              daysLeft: 0,
            },
          })

          await prisma.notification.create({
            data: {
              type: "SUBSCRIPTION_EXPIRED" as any,
              message: `⚠️ Votre abonnement a expiré. Votre compte a été suspendu. Veuillez contacter l'administration pour renouveler.`,
              schoolId: school.id,
              userId: school.creeParId,
              targetRole: "SCHOOL_USER_ONLY" as any,
              daysLeft: 0,
            },
          })

          if (school.creeParId) {
            await getSupabaseAdmin()
              .channel(`notifications:user:${school.creeParId}`)
              .send({
                type: "broadcast",
                event: "new_notification",
                payload: {
                  type: "SUBSCRIPTION_EXPIRED",
                  daysLeft: 0,
                },
              })
          }

          notificationsCreated.push({
            school: school.nomEtablissement,
            type: "SUBSCRIPTION_EXPIRED",
            daysLeft: 0,
          })
        }

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
