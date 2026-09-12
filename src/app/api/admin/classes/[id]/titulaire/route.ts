import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getAuthUser,
  requireRole,
  handleApiError,
  getSchoolCurrentYearId,
} from "@/lib/fees/api-helpers"
import { primaryDegreeCodeForLevel } from "@/lib/grading/primary-maxima"
import { ensurePrimaryCurriculum } from "@/lib/grading/ensure-primary-curriculum"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/**
 * POST { teacherId, yearId? }
 * Assigne un titulaire primaire et crée les CourseAssignment pour toutes les branches actives du degré.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const { id } = await params
    const classId = parseInt(id, 10)
    if (!classId) {
      return NextResponse.json({ error: "Classe invalide" }, { status: 400 })
    }

    const body = await req.json()
    const teacherId = parseInt(body.teacherId, 10)
    if (!teacherId) {
      return NextResponse.json({ error: "teacherId requis" }, { status: 400 })
    }

    const yearId = body.yearId
      ? parseInt(body.yearId, 10)
      : await getSchoolCurrentYearId(user.schoolId)
    if (!yearId) {
      return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
    }

    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId: user.schoolId },
    })
    if (!cls) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 })
    }
    if (cls.section !== "Primaire") {
      return NextResponse.json(
        { error: "L'affectation d'un titulaire n'est disponible que pour le primaire" },
        { status: 400 }
      )
    }

    const degreeCode = primaryDegreeCodeForLevel(cls.level)
    if (!degreeCode) {
      return NextResponse.json(
        { error: `Niveau primaire non reconnu: ${cls.level}` },
        { status: 400 }
      )
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, user: { schoolId: user.schoolId } },
      select: {
        id: true,
        lastName: true,
        middleName: true,
        firstName: true,
        titulaireClasses: { select: { id: true, name: true } },
      },
    })
    if (!teacher) {
      return NextResponse.json({ error: "Enseignant introuvable" }, { status: 404 })
    }

    const other = teacher.titulaireClasses.find((c) => c.id !== classId)
    if (other) {
      return NextResponse.json(
        {
          error: `Cet enseignant est déjà titulaire de « ${other.name} ». Un titulaire primaire ne peut avoir qu'une seule classe.`,
        },
        { status: 400 }
      )
    }

    await ensurePrimaryCurriculum(user.schoolId)

    const degree = await prisma.primaryDegree.findUnique({
      where: { schoolId_code: { schoolId: user.schoolId, code: degreeCode } },
      include: {
        domains: {
          include: {
            branches: {
              where: { isActive: true, subjectId: { not: null } },
              select: { id: true, subjectId: true },
            },
          },
        },
      },
    })
    if (!degree) {
      return NextResponse.json(
        { error: "Structure primaire non initialisée pour ce degré" },
        { status: 400 }
      )
    }

    if (degree.needsReview) {
      return NextResponse.json(
        {
          error:
            "Ce degré est marqué « à vérifier ». Confirmez d'abord les maxima dans Notes & Bulletins → Branches primaire.",
          needsReview: true,
          degreeCode: degree.code,
        },
        { status: 400 }
      )
    }

    const subjectIds = [
      ...new Set(
        degree.domains
          .flatMap((d) => d.branches)
          .map((b) => b.subjectId)
          .filter((id): id is number => id != null)
      ),
    ]

    if (subjectIds.length === 0) {
      return NextResponse.json({ error: "Aucune branche active pour ce degré" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.class.update({
        where: { id: classId },
        data: { titulaireTeacherId: teacherId },
      })

      let created = 0
      let updated = 0
      for (const subjectId of subjectIds) {
        const existing = await tx.courseAssignment.findUnique({
          where: {
            subjectId_classId_yearId_schoolId: {
              subjectId,
              classId,
              yearId,
              schoolId: user.schoolId,
            },
          },
        })
        if (existing) {
          await tx.courseAssignment.update({
            where: { id: existing.id },
            data: {
              teacherId,
              isActive: true,
              weeklyHours: existing.weeklyHours || 1,
            },
          })
          updated += 1
        } else {
          await tx.courseAssignment.create({
            data: {
              subjectId,
              classId,
              yearId,
              schoolId: user.schoolId,
              teacherId,
              weeklyHours: 1,
              isActive: true,
            },
          })
          created += 1
        }
      }

      return { created, updated, total: subjectIds.length }
    })

    const teacherName = [teacher.lastName, teacher.middleName, teacher.firstName]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()

    return NextResponse.json({
      ok: true,
      classId,
      teacherId,
      teacherName,
      degreeCode,
      ...result,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/** DELETE — retire le titulaire (conserve les CourseAssignment). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(_req)
    requireRole(user, ROLES)

    const { id } = await params
    const classId = parseInt(id, 10)
    if (!classId) {
      return NextResponse.json({ error: "Classe invalide" }, { status: 400 })
    }

    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId: user.schoolId },
    })
    if (!cls) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 })
    }

    await prisma.class.update({
      where: { id: classId },
      data: { titulaireTeacherId: null },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
