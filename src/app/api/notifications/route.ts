import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"
const DEFAULT_LIMIT = 10

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

// GET /api/notifications?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const userId = decoded.id
    const userRole = decoded.role
    const userSchoolId = decoded.schoolId

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT)))
    const skip = (page - 1) * limit

    const where =
      userRole === "SUPER_ADMIN"
        ? {
            OR: [
              { userId: null, targetRole: { in: ["SUPER_ADMIN_ONLY", "ALL"] as any[] } },
              { userId: userId },
            ],
          }
        : {
            OR: [
              { userId: null, targetRole: { in: ["SCHOOL_USER_ONLY", "ALL"] as any[] }, ...(userSchoolId ? { schoolId: userSchoolId } : {}) },
              { userId: userId, targetRole: { in: ["SCHOOL_USER_ONLY", "ALL"] as any[] } },
            ],
          }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    return NextResponse.json({
      notifications,
      total,
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
    const userId = decoded.id
    const userRole = decoded.role
    const userSchoolId = decoded.schoolId

    if (userRole === "SUPER_ADMIN") {
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: null, targetRole: { in: ["SUPER_ADMIN_ONLY", "ALL"] as any[] }, isRead: false },
            { userId: userId, isRead: false },
          ],
        },
        data: { isRead: true },
      })
    } else {
      await prisma.notification.updateMany({
        where: {
          isRead: false,
          OR: [
            { userId: null, targetRole: { in: ["SCHOOL_USER_ONLY", "ALL"] as any[] }, ...(userSchoolId ? { schoolId: userSchoolId } : {}) },
            { userId: userId },
          ],
        },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erreur mise à jour notifications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
