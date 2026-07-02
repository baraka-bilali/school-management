import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { getSupabaseAdmin } from "@/lib/supabase-server"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  name: string
}

// POST /api/notifications/broadcast
// Corps : { message: string, target: "ALL" | "SUPER_ADMIN_ONLY" | "SCHOOL_USER_ONLY" }
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès réservé au Super Admin" }, { status: 403 })
    }

    const body = await req.json()
    const message: string = body.message?.trim()
    const target: "ALL" | "SUPER_ADMIN_ONLY" | "SCHOOL_USER_ONLY" = body.target || "ALL"

    if (!message || message.length < 5) {
      return NextResponse.json({ error: "Message trop court (min. 5 caractères)" }, { status: 400 })
    }
    if (message.length > 500) {
      return NextResponse.json({ error: "Message trop long (max. 500 caractères)" }, { status: 400 })
    }

    // Créer la notification système en base
    const notification = await prisma.notification.create({
      data: {
        type: "SYSTEM_MESSAGE" as any,
        message: `📢 ${message}`,
        schoolId: null,
        userId: null,
        targetRole: target as any,
        daysLeft: null,
      },
    })

    // Broadcaster via Supabase Realtime selon la cible
    const payload = {
      type: "SYSTEM_MESSAGE",
      message: `📢 ${message}`,
      notificationId: notification.id,
    }

    if (target === "ALL" || target === "SUPER_ADMIN_ONLY") {
      await getSupabaseAdmin().channel("notifications:super-admin").send({
        type: "broadcast",
        event: "new_notification",
        payload,
      })
    }

    if (target === "ALL" || target === "SCHOOL_USER_ONLY") {
      // Récupérer tous les admins d'école actifs et broadcaster à chacun
      const schoolAdmins = await prisma.user.findMany({
        where: { role: { not: "SUPER_ADMIN" } },
        select: { id: true },
      })
      for (const admin of schoolAdmins) {
        await getSupabaseAdmin()
          .channel(`notifications:user:${admin.id}`)
          .send({ type: "broadcast", event: "new_notification", payload })
      }
    }

    return NextResponse.json({ success: true, notificationId: notification.id })
  } catch (error) {
    console.error("❌ Erreur broadcast notification:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
