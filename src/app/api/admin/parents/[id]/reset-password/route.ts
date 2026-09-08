import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { generatePassword } from "@/lib/generateCredentials"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const allowedRoles = ["ADMIN", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const parentId = parseInt((await context.params).id, 10)
    if (isNaN(parentId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 })

    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: { user: { select: { id: true, email: true, schoolId: true } } },
    })

    if (!parent) return NextResponse.json({ error: "Parent introuvable" }, { status: 404 })

    if (decoded.schoolId && parent.user?.schoolId !== decoded.schoolId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const newPassword = generatePassword()
    const hashed = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: parent.user!.id },
      data: { password: hashed, temporaryPassword: true },
    })

    return NextResponse.json({
      newPassword,
      parent: { email: parent.user!.email },
    })
  } catch (error) {
    console.error("Erreur reset password parent:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
