import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { notificationScopeWhere } from "@/lib/notification-scope"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"
const DEFAULT_LIMIT = 50

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

// GET /api/notifications?page=1&limit=50&unreadOnly=true
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

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(
      100,
      parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)
    )
    const skip = (page - 1) * limit
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const where = unreadOnly
      ? { AND: [scopeWhere, { isRead: false }] }
      : scopeWhere

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { AND: [scopeWhere, { isRead: false }] },
      }),
    ])

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      page,
      limit,
      hasMore: skip + notifications.length < total,
    })
  } catch (error) {
    console.error("❌ Erreur récupération notifications:", error)
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
    const scopeWhere = notificationScopeWhere({
      userId: decoded.id,
      userRole: decoded.role,
      userSchoolId: decoded.schoolId,
    })

    await prisma.notification.updateMany({
      where: { AND: [scopeWhere, { isRead: false }] },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur mise à jour notifications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
