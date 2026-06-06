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

    let notifications

    if (userRole === "SUPER_ADMIN") {
      // Super Admin : voit uniquement les notifications SUPER_ADMIN_ONLY (globales)
      // et ses notifications personnelles — pas les messages destinés aux écoles
      notifications = await prisma.notification.findMany({
        where: {
          OR: [
            {
              userId: null,
              targetRole: { in: ["SUPER_ADMIN_ONLY", "ALL"] as any[] },
            },
            { userId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    } else {
      // Utilisateurs école : voient uniquement leurs notifications personnelles
      // SCHOOL_USER_ONLY ou ALL
      notifications = await prisma.notification.findMany({
        where: {
          userId: userId,
          targetRole: { in: ["SCHOOL_USER_ONLY", "ALL"] as any[] },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des notifications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/notifications - Marquer toutes comme lues
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const userId = decoded.id
    const userRole = decoded.role

    if (userRole === "SUPER_ADMIN") {
      // Marquer comme lues toutes les notifications globales + personnelles du super admin
      await prisma.notification.updateMany({
        where: {
          OR: [
            {
              userId: null,
              targetRole: { in: ["SUPER_ADMIN_ONLY", "ALL"] as any[] },
              isRead: false,
            },
            { userId: userId, isRead: false },
          ],
        },
        data: { isRead: true },
      })
    } else {
      await prisma.notification.updateMany({
        where: { userId: userId, isRead: false },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des notifications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
