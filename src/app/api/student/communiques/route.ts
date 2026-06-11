import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

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

export async function GET(req: NextRequest) {
  const student = await getStudentFromToken(req)
  if (!student) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const schoolId = student.user.schoolId
  if (!schoolId) {
    return NextResponse.json({ error: "École introuvable" }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  const [communiques, total] = await Promise.all([
    prisma.communique.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        createdBy: { select: { name: true, nom: true, prenom: true } },
        reads: {
          where: { studentId: student.id },
          select: { readAt: true },
        },
      },
    }),
    prisma.communique.count({ where: { schoolId } }),
  ])

  const communiquesWithReadStatus = communiques.map((c) => ({
    ...c,
    isRead: c.reads.length > 0,
    reads: undefined,
  }))

  return NextResponse.json({
    communiques: communiquesWithReadStatus,
    total,
    page,
    hasMore: skip + communiques.length < total,
  })
}
