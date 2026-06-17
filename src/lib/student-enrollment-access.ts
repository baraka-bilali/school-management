import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = { id: number; role: string; schoolId?: number }

const FULL_ACCESS_ROLES = new Set(["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"])

/** Accès lecture liste / inscription élèves */
export async function assertStudentEnrollmentAccess(req: NextRequest): Promise<JwtPayload & { schoolId: number }> {
  const token = req.cookies.get("token")?.value
  if (!token) throw new EnrollmentAccessError("Non autorisé", 401)

  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
  if (!decoded.schoolId) throw new EnrollmentAccessError("Aucune école associée", 403)

  if (FULL_ACCESS_ROLES.has(decoded.role)) {
    return { ...decoded, schoolId: decoded.schoolId }
  }

  if (decoded.role === "CAISSIER") {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { canEnrollStudents: true, isActive: true },
    })
    if (!user?.isActive || !user.canEnrollStudents) {
      throw new EnrollmentAccessError("Permission d'inscription non accordée", 403)
    }
    return { ...decoded, schoolId: decoded.schoolId }
  }

  throw new EnrollmentAccessError("Accès refusé", 403)
}

export class EnrollmentAccessError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
