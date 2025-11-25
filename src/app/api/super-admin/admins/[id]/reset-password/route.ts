import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  id: number
  role: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = request.headers.get("cookie")
    const token = cookieHeader?.split("; ").find(row => row.startsWith("token="))?.split("=")[1]

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    
    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const adminId = parseInt(params.id)

    // Générer un nouveau mot de passe temporaire
    const newPassword = Math.random().toString(36).slice(-8).toUpperCase()
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe et marquer comme temporaire
    const admin = await prisma.user.update({
      where: { id: adminId },
      data: { 
        password: hashedPassword,
        temporaryPassword: true
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true
      }
    })

    console.log(`✅ Mot de passe réinitialisé pour: ${admin.email}`)

    return NextResponse.json({
      success: true,
      newPassword: newPassword,
      admin: {
        id: admin.id,
        email: admin.email,
        nom: admin.nom,
        prenom: admin.prenom
      }
    })

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation du mot de passe:", error)
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation du mot de passe" },
      { status: 500 }
    )
  }
}
