import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"
type JwtPayload = { id: number; role: string; schoolId?: number }

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return NextResponse.json({ unread: 0 })

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (decoded.role !== "ELEVE") return NextResponse.json({ unread: 0 })

    const unread = await prisma.notification.count({
      where: { userId: decoded.id, isRead: false },
    })

    return NextResponse.json({ unread })
  } catch {
    return NextResponse.json({ unread: 0 })
  }
}
