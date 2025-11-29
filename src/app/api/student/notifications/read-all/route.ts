import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  id: number
  role: string
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie")
    const token = cookieHeader?.split("; ").find(row => row.startsWith("token="))?.split("=")[1]

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    
    if (decoded.role !== "ELEVE") {
      return NextResponse.json({ error: "Accès réservé aux élèves" }, { status: 403 })
    }

    // Marquer toutes les notifications de l'utilisateur comme lues
    await prisma.notification.updateMany({
      where: {
        userId: decoded.id,
        isRead: false
      },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Erreur:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
