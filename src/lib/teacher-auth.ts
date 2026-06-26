import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"

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

export async function getTeacherFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (decoded.role !== "PROFESSEUR") return null

    const teacher = await prisma.teacher.findFirst({
      where: { userId: decoded.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            schoolId: true,
            school: { select: { nomEtablissement: true, profilePhotoUrl: true, logoUrl: true } },
          },
        },
      },
    })

    if (!teacher) return null

    const schoolId = teacher.user.schoolId ?? decoded.schoolId ?? null
    if (!schoolId) return null

    const yearId = await getSchoolCurrentYearId(schoolId)

    return {
      teacherId: teacher.id,
      userId: teacher.user.id,
      schoolId,
      yearId,
      teacher,
      schoolName: teacher.user.school?.nomEtablissement ?? null,
    }
  } catch {
    return null
  }
}

export { getTaskTimeProgress, isTaskOverdue, getGreeting } from "@/lib/student-auth"
