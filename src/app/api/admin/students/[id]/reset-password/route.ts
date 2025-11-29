import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { generatePassword } from "@/lib/generateCredentials"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  id: number
  role: string
  schoolId?: number
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
    
    // Vérifier que l'utilisateur est un admin
    if (decoded.role !== "ADMIN" && decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const studentId = parseInt(params.id)

    // Récupérer l'élève avec son utilisateur
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            schoolId: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    // Vérifier que l'admin a le droit de modifier cet élève (même école)
    if (decoded.role === "ADMIN" && student.user.schoolId !== decoded.schoolId) {
      return NextResponse.json({ error: "Accès refusé - École différente" }, { status: 403 })
    }

    // Générer un nouveau mot de passe sécurisé (14 caractères)
    const newPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe et marquer comme temporaire
    await prisma.user.update({
      where: { id: student.user.id },
      data: { 
        password: hashedPassword,
        temporaryPassword: true
      }
    })

    console.log(`✅ Mot de passe réinitialisé pour l'élève: ${student.lastName} ${student.firstName} (${student.user.email})`)

    return NextResponse.json({
      success: true,
      newPassword: newPassword,
      student: {
        id: student.id,
        lastName: student.lastName,
        middleName: student.middleName,
        firstName: student.firstName,
        code: student.code,
        email: student.user.email
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
