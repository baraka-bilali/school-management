import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

// GET /api/notifications - Récupérer les notifications
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const userId = decoded.id
    const userRole = decoded.role

    // Super admin voit toutes les notifications
    // Admins d'école voient seulement leurs notifications
    let notifications

    if (userRole === "SUPER_ADMIN") {
      // Super admin voit toutes les notifications
      notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { userId: null }, // Notifications globales
            { userId: userId }, // Notifications personnelles
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    } else {
      // Autres utilisateurs voient seulement leurs notifications
      notifications = await prisma.notification.findMany({
        where: { userId: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des notifications:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// POST /api/notifications/mark-all-read - Marquer toutes comme lues
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const userId = decoded.id

    await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des notifications:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
