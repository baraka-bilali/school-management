import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

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
    const { birthPlace, nationality, address, parentName1, parentPhone1, parentEmail1, parentName2, parentPhone2, parentEmail2, bloodGroup, allergies, medicalNotes, emergencyContact, emergencyPhone, profileCompleted } = body

    const student = await prisma.student.findFirst({
      where: { userId: decoded.id },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...(birthPlace !== undefined && { birthPlace }),
        ...(nationality !== undefined && { nationality }),
        ...(address !== undefined && { address }),
        ...(parentName1 !== undefined && { parentName1 }),
        ...(parentPhone1 !== undefined && { parentPhone1 }),
        ...(parentEmail1 !== undefined && { parentEmail1 }),
        ...(parentName2 !== undefined && { parentName2 }),
        ...(parentPhone2 !== undefined && { parentPhone2 }),
        ...(parentEmail2 !== undefined && { parentEmail2 }),
        ...(bloodGroup !== undefined && { bloodGroup }),
        ...(allergies !== undefined && { allergies }),
        ...(medicalNotes !== undefined && { medicalNotes }),
        ...(emergencyContact !== undefined && { emergencyContact }),
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
