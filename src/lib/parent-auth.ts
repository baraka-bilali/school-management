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

export async function getParentFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (decoded.role !== "PARENT") return null

    const parent = await prisma.parent.findFirst({
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
        students: {
          include: {
            student: {
              select: {
                id: true,
                permanentCode: true,
                lastName: true,
                middleName: true,
                firstName: true,
                gender: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    })

    if (!parent) return null

    const schoolId = parent.user.schoolId ?? decoded.schoolId ?? null
    if (!schoolId) return null

    const yearId = await getSchoolCurrentYearId(schoolId)

    return {
      parentId: parent.id,
      userId: parent.user.id,
      schoolId,
      yearId,
      parent,
      schoolName: parent.user.school?.nomEtablissement ?? null,
    }
  } catch {
    return null
  }
}

export { getGreeting } from "@/lib/student-auth"
