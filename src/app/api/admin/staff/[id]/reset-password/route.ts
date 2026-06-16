import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { generatePassword } from "@/lib/generateCredentials"
import { isStaffRole } from "@/lib/staff-roles"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

const MANAGER_ROLES = new Set(["ADMIN", "DIRECTEUR_ETUDES"])

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (!MANAGER_ROLES.has(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const params = await context.params
    const userId = parseInt(params.id)
    if (isNaN(userId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, schoolId: true, role: true, nom: true, prenom: true },
    })

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    if (!isStaffRole(user.role)) {
      return NextResponse.json({ error: "Ce compte n'est pas un membre du personnel" }, { status: 400 })
    }
    if (decoded.schoolId && user.schoolId !== decoded.schoolId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const newPassword = generatePassword()
    const hashed = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, temporaryPassword: true },
    })

    return NextResponse.json({
      newPassword,
      user: { email: user.email, nom: user.nom, prenom: user.prenom },
    })
  } catch (error) {
    console.error("Erreur reset password staff:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
