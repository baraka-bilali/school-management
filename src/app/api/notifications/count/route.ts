import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { notificationScopeWhere } from "@/lib/notification-scope"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

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
    const scopeWhere = notificationScopeWhere({
      userId: decoded.id,
      userRole: decoded.role,
      userSchoolId: decoded.schoolId,
    })

    const count = await prisma.notification.count({
      where: { AND: [scopeWhere, { isRead: false }] },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("❌ Erreur lors du comptage des notifications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
