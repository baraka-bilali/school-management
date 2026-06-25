import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getStudentActiveYearId } from "@/lib/communique-year"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = { id: number; role: string; schoolId?: number }

async function getStudentFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (decoded.role !== "ELEVE") return null
    const student = await prisma.student.findFirst({
      where: { userId: decoded.id },
      select: { id: true, userId: true, user: { select: { schoolId: true } } },
    })
    return student
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const student = await getStudentFromToken(req)
  if (!student) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const communiqueId = parseInt(id)
  const schoolId = student.user.schoolId

  const yearId = await getStudentActiveYearId(student.id)
  if (!yearId) {
    return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 })
  }

  const communique = await prisma.communique.findFirst({
    where: { id: communiqueId, schoolId: schoolId ?? undefined, yearId },
    include: {
      createdBy: { select: { name: true, nom: true, prenom: true } },
    },
  })

  if (!communique) {
    return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 })
  }

  // Marquer comme lu
  await prisma.communiqueRead.upsert({
    where: { communiqueId_studentId: { communiqueId, studentId: student.id } },
    create: { communiqueId, studentId: student.id },
    update: {},
  })

  return NextResponse.json({ communique })
}
