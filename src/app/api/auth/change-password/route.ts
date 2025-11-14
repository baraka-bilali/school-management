import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  id: number
  email: string
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

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Validation
    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Nouveau mot de passe et confirmation requis" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Les mots de passe ne correspondent pas" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      )
    }

    // Si l'utilisateur n'a pas de mot de passe temporaire, vérifier l'ancien mot de passe
    if (!user.temporaryPassword && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (!isMatch) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 401 }
        )
      }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe et désactiver le flag temporaire
    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        password: hashedPassword,
        temporaryPassword: false
      }
    })

    console.log(`✅ Mot de passe changé pour: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: "Mot de passe changé avec succès"
    })

  } catch (error) {
    console.error("❌ Erreur lors du changement de mot de passe:", error)
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    )
  }
}
