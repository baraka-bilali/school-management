import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

// GET /api/notifications/count - Compter les notifications non lues
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const userId = decoded.id
    const userRole = decoded.role

    let count

    if (userRole === "SUPER_ADMIN") {
      // Super admin voit toutes les notifications non lues
      count = await prisma.notification.count({
        where: {
          isRead: false,
          OR: [
            { userId: null }, // Notifications globales
            { userId: userId }, // Notifications personnelles
          ],
        },
      })
    } else {
      // Autres utilisateurs voient seulement leurs notifications non lues
      count = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false,
        },
      })
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error("❌ Erreur lors du comptage des notifications:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
