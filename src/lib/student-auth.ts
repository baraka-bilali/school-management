import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = { id: number; role: string; schoolId?: number }

function getTokenFromRequest(req: NextRequest): string | null {
  const fromCookie = req.cookies.get("token")?.value
  if (fromCookie) return fromCookie

  const cookieHeader = req.headers.get("cookie")
  if (!cookieHeader) return null
  const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith("token="))
  return match ? match.slice("token=".length) : null
}

export async function getStudentFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (decoded.role !== "ELEVE") return null

    const student = await prisma.student.findFirst({
      where: { userId: decoded.id },
      include: {
        user: {
          select: {
            schoolId: true,
            email: true,
            school: { select: { nomEtablissement: true } },
          },
        },
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: { select: { id: true, name: true, schoolId: true } },
            year: { select: { id: true, name: true, current: true } },
          },
          orderBy: { year: { name: "desc" } },
          take: 1,
        },
      },
    })

    if (!student) return null

    const enrollment = student.enrollments[0]
    const schoolId =
      student.user.schoolId ?? decoded.schoolId ?? enrollment?.class?.schoolId ?? null

    return {
      studentId: student.id,
      userId: student.userId,
      schoolId,
      classId: enrollment?.classId ?? null,
      yearId: enrollment?.yearId ?? null,
      schoolName: student.user.school?.nomEtablissement ?? null,
      student,
      enrollment,
    }
  } catch {
    return null
  }
}

export function getGreeting(): "Bonjour" | "Bonsoir" {
  const hour = new Date().getHours()
  return hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour"
}

export function getTaskTimeProgress(createdAt: Date | string, dueAt: Date | string): number {
  const now = Date.now()
  const start = new Date(createdAt).getTime()
  const end = new Date(dueAt).getTime()
  if (end <= start) return now >= end ? 100 : 0
  if (now >= end) return 100
  if (now <= start) return 0
  return Math.round(((now - start) / (end - start)) * 100)
}

export function isTaskOverdue(dueAt: Date | string): boolean {
  return Date.now() > new Date(dueAt).getTime()
}
