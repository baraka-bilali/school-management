import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

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
    const userId = decoded.id
    const userRole = decoded.role
    const userSchoolId = decoded.schoolId

    let count

    if (userRole === "SUPER_ADMIN") {
      count = await prisma.notification.count({
        where: {
          isRead: false,
          OR: [
            {
              userId: null,
              targetRole: { in: ["SUPER_ADMIN_ONLY", "ALL"] as any[] },
            },
            { userId: userId },
          ],
        },
      })
    } else {
      count = await prisma.notification.count({
        where: {
          isRead: false,
          OR: [
            { userId: null, targetRole: { in: ["SCHOOL_USER_ONLY", "ALL"] as any[] }, ...(userSchoolId ? { schoolId: userSchoolId } : {}) },
            { userId: userId, targetRole: { in: ["SCHOOL_USER_ONLY", "ALL"] as any[] } },
          ],
        },
      })
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error("❌ Erreur lors du comptage des notifications:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
