import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string }
    if (decoded.role !== "ELEVE") {
      return NextResponse.json({ error: "Réservé aux élèves" }, { status: 403 })
    }

    await prisma.user.update({
      where: { id: decoded.id },
      data: { temporaryPassword: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("skip-password-change:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
