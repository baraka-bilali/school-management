import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"
type JwtPayload = { id: number; role: string; schoolId?: number }

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (decoded.role !== "ELEVE" || !decoded.schoolId) {
      return NextResponse.json({ error: "Accès réservé aux élèves" }, { status: 403 })
    }

    const student = await prisma.student.findFirst({
      where: { userId: decoded.id },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json({ error: "Profil élève introuvable" }, { status: 404 })
    }

    const unread = await prisma.communique.findMany({
      where: {
        schoolId: decoded.schoolId,
        reads: { none: { studentId: student.id } },
      },
      select: { id: true },
    })

    if (unread.length > 0) {
      await prisma.communiqueRead.createMany({
        data: unread.map((c) => ({ communiqueId: c.id, studentId: student.id })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ success: true, marked: unread.length })
  } catch (error) {
    console.error("Erreur marquage communiqués:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
