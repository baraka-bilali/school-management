import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { normalizeStudentProfile, isStudentProfileComplete } from "@/lib/student-fields"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = { id: number; role: string }

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (decoded.role !== "ELEVE") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const profile = normalizeStudentProfile(body)
    const {
      parentPhone1,
      parentEmail1,
      parentPhone2,
      parentEmail2,
      bloodGroup,
      emergencyPhone,
      profileCompleted,
    } = body

    const student = await prisma.student.findFirst({
      where: { userId: decoded.id },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    if (profileCompleted === true) {
      const merged = { ...body, ...profile }
      if (!isStudentProfileComplete(merged)) {
        return NextResponse.json(
          { error: "Veuillez remplir tous les champs obligatoires du profil" },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...profile,
        ...(parentPhone1 !== undefined && { parentPhone1 }),
        ...(parentEmail1 !== undefined && { parentEmail1 }),
        ...(parentPhone2 !== undefined && { parentPhone2 }),
        ...(parentEmail2 !== undefined && { parentEmail2 }),
        ...(bloodGroup !== undefined && { bloodGroup }),
        ...(emergencyPhone !== undefined && { emergencyPhone }),
        ...(profileCompleted !== undefined && { profileCompleted }),
      },
    })

    return NextResponse.json({ success: true, profileCompleted: updated.profileCompleted })
  } catch (error) {
    console.error("Erreur PATCH student/profile:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
