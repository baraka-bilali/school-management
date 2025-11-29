import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  id: number
  role: string
  schoolId?: number
}

export async function GET(request: NextRequest) {
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

    // Récupérer les notifications de l'utilisateur
    const notifications = await prisma.notification.findMany({
      where: {
        userId: decoded.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50 // Limiter à 50 notifications
    })

    return NextResponse.json({ notifications })

  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
