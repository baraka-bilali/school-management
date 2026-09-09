import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { invalidateCachePattern } from "@/lib/cache"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

/**
 * POST /api/admin/enrollments/[id]/confirm
 * PROPOSEE → CONFIRMEE (ou ACTIVE si activate=true).
 * Accessible admin / directeur études, ou parent lié à l'élève.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuth(req)
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const enrollmentId = parseInt((await context.params).id, 10)
    if (Number.isNaN(enrollmentId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const activate = Boolean(body.activate)

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { id: true, user: { select: { schoolId: true } } } },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Inscription introuvable" }, { status: 404 })
    }

    const schoolId = enrollment.student.user.schoolId
    const adminRoles = ["ADMIN", "DIRECTEUR_ETUDES"]

    if (adminRoles.includes(auth.role)) {
      if (!auth.schoolId || auth.schoolId !== schoolId) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
      }
    } else if (auth.role === "PARENT") {
      const link = await prisma.parentStudent.findFirst({
        where: { studentId: enrollment.studentId, parent: { userId: auth.id } },
      })
      if (!link) {
        return NextResponse.json(
          { error: "Cet élève n'est pas lié à votre compte" },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    if (enrollment.status !== "PROPOSEE" && enrollment.status !== "CONFIRMEE") {
      return NextResponse.json(
        { error: `Impossible de confirmer une inscription en statut ${enrollment.status}` },
        { status: 400 }
      )
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: activate ? "ACTIVE" : "CONFIRMEE" },
      include: { class: true, year: true },
    })

    invalidateCachePattern("students-*")
    return NextResponse.json({ enrollment: updated })
  } catch (error) {
    console.error("Erreur confirmation inscription:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
