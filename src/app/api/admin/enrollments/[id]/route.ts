import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getNextClassCode } from "@/lib/student-fields"
import { invalidateCachePattern } from "@/lib/cache"
import { isSameOrHigherClass } from "@/lib/class-sort"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

const ALLOWED = ["ADMIN", "DIRECTEUR_ETUDES"]

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
 * PATCH /api/admin/enrollments/[id]
 * Body: { classId: number }
 *
 * Change la classe d'une inscription N+1 (PROPOSEE / CONFIRMEE / ACTIVE)
 * sans modifier le statut. Utile pour réaffecter 3ème A → 3ème B.
 * Règle: même niveau ou supérieur uniquement (pas de régression).
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId || !ALLOWED.includes(auth.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const enrollmentId = parseInt((await context.params).id, 10)
    if (Number.isNaN(enrollmentId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const classId = Number(body.classId)
    if (!classId) {
      return NextResponse.json({ error: "classId requis" }, { status: 400 })
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { id: true, user: { select: { schoolId: true } } } },
        class: {
          select: { id: true, name: true, section: true, level: true, letter: true },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Inscription introuvable" }, { status: 404 })
    }

    if (enrollment.student.user.schoolId !== auth.schoolId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const editableStatuses = ["PROPOSEE", "CONFIRMEE", "ACTIVE"] as const
    if (!editableStatuses.includes(enrollment.status as (typeof editableStatuses)[number])) {
      return NextResponse.json(
        {
          error: `Impossible de changer la classe d'une inscription en statut ${enrollment.status}`,
        },
        { status: 400 }
      )
    }

    if (enrollment.classId === classId) {
      return NextResponse.json({
        enrollment: {
          id: enrollment.id,
          classId: enrollment.classId,
          status: enrollment.status,
          code: enrollment.code,
        },
        unchanged: true,
      })
    }

    const targetClass = await prisma.class.findFirst({
      where: { id: classId, schoolId: auth.schoolId },
      select: {
        id: true,
        name: true,
        section: true,
        level: true,
        letter: true,
        stream: true,
      },
    })
    if (!targetClass) {
      return NextResponse.json(
        { error: "Classe cible invalide pour cette école" },
        { status: 400 }
      )
    }

    if (
      enrollment.class.section &&
      enrollment.class.level &&
      targetClass.section &&
      targetClass.level &&
      !isSameOrHigherClass(
        { section: enrollment.class.section, level: enrollment.class.level },
        { section: targetClass.section, level: targetClass.level }
      )
    ) {
      return NextResponse.json(
        {
          error: `Classe « ${targetClass.name} » n'est pas au même niveau ni supérieure à « ${enrollment.class.name} »`,
        },
        { status: 400 }
      )
    }

    const code = String(await getNextClassCode(classId, enrollment.yearId))

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { classId, code },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true,
            section: true,
            letter: true,
            stream: true,
          },
        },
        year: { select: { id: true, name: true } },
        student: {
          select: {
            id: true,
            permanentCode: true,
            lastName: true,
            middleName: true,
            firstName: true,
            gender: true,
          },
        },
      },
    })

    invalidateCachePattern("students-*")

    return NextResponse.json({
      enrollment: {
        id: updated.id,
        studentId: updated.studentId,
        classId: updated.classId,
        yearId: updated.yearId,
        code: updated.code,
        status: updated.status,
        origine: updated.origine,
        student: updated.student,
        class: updated.class,
        year: updated.year,
      },
    })
  } catch (error) {
    console.error("Erreur changement de classe:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
