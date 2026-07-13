import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import { isStaffPortalRole, getStaffRoleLabel } from "@/lib/staff-roles"

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

export async function getStaffFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (!isStaffPortalRole(decoded.role)) return null

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        school: { select: { nomEtablissement: true, profilePhotoUrl: true, logoUrl: true } },
      },
    })

    if (!user || !user.isActive) return null

    const schoolId = user.schoolId ?? decoded.schoolId ?? null
    if (!schoolId) return null

    const yearId = await getSchoolCurrentYearId(schoolId)

    return {
      userId: user.id,
      schoolId,
      yearId,
      role: user.role,
      roleLabel: getStaffRoleLabel(user.role),
      user,
      schoolName: user.school?.nomEtablissement ?? null,
    }
  } catch {
    return null
  }
}

export { getGreeting } from "@/lib/student-auth"
