import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { teacherHasClassAccess } from "@/lib/teacher-classes"
import { PRIMARY_PERIOD_COLUMN_LABEL } from "@/lib/grading/primary-cotation"

/**
 * POST — envoyer les résultats à l'admin (verrouille toutes les branches
 * pour une période ou un examen du trimestre).
 * body: { classId, kind: "PERIOD"|"EXAM", periodId?, periodGroupId? }
 */
export async function POST(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!ctx.yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const body = await req.json()
  const classId = parseInt(body.classId, 10)
  const kind = body.kind === "EXAM" ? "EXAM" : body.kind === "PERIOD" ? "PERIOD" : null
  const periodId = body.periodId != null ? parseInt(body.periodId, 10) : null
  const periodGroupId =
    body.periodGroupId != null ? parseInt(body.periodGroupId, 10) : null

  if (!classId || !kind) {
    return NextResponse.json(
      { error: "classId et kind (PERIOD|EXAM) requis" },
      { status: 400 }
    )
  }
  if (kind === "PERIOD" && !periodId) {
    return NextResponse.json({ error: "periodId requis" }, { status: 400 })
  }
  if (kind === "EXAM" && !periodGroupId) {
    return NextResponse.json({ error: "periodGroupId requis" }, { status: 400 })
  }

  const allowed = await teacherHasClassAccess(
    ctx.teacherId,
    ctx.schoolId,
    ctx.yearId,
    classId
  )
  if (!allowed) {
    return NextResponse.json({ error: "Classe non assignée" }, { status: 403 })
  }

  const classRow = await prisma.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId, section: "Primaire" },
  })
  if (!classRow) {
    return NextResponse.json({ error: "Classe primaire introuvable" }, { status: 404 })
  }

  if (kind === "PERIOD") {
    const period = await prisma.period.findFirst({
      where: {
        id: periodId!,
        periodGroup: { cycle: { schoolId: ctx.schoolId, kind: "PRIMARY" } },
      },
    })
    if (!period) {
      return NextResponse.json({ error: "Période introuvable" }, { status: 404 })
    }
  } else {
    const group = await prisma.periodGroup.findFirst({
      where: {
        id: periodGroupId!,
        cycle: { schoolId: ctx.schoolId, kind: "PRIMARY" },
      },
    })
    if (!group) {
      return NextResponse.json({ error: "Trimestre introuvable" }, { status: 404 })
    }
  }

  const assignments = await prisma.courseAssignment.findMany({
    where: {
      teacherId: ctx.teacherId,
      schoolId: ctx.schoolId,
      yearId: ctx.yearId,
      classId,
      isActive: true,
    },
  })

  if (assignments.length === 0) {
    return NextResponse.json({ error: "Aucune branche assignée" }, { status: 400 })
  }

  const assignmentIds = assignments.map((a) => a.id)

  // Refuser l'envoi si aucune note officielle n'a été saisie pour l'événement
  if (kind === "PERIOD") {
    const gradeCount = await prisma.grade.count({
      where: {
        enrollment: { classId, yearId: ctx.yearId, status: "ACTIVE" },
        column: {
          periodId: periodId!,
          label: PRIMARY_PERIOD_COLUMN_LABEL,
          courseAssignmentId: { in: assignmentIds },
        },
      },
    })
    if (gradeCount === 0) {
      return NextResponse.json(
        {
          error:
            "Impossible d'envoyer : aucune note saisie pour cette période. Enregistrez d'abord les cotations.",
        },
        { status: 400 }
      )
    }
  } else {
    const examCount = await prisma.examGrade.count({
      where: {
        periodGroupId: periodGroupId!,
        courseAssignmentId: { in: assignmentIds },
        enrollment: { classId, yearId: ctx.yearId, status: "ACTIVE" },
      },
    })
    if (examCount === 0) {
      return NextResponse.json(
        {
          error:
            "Impossible d'envoyer : aucune note d'examen saisie. Enregistrez d'abord les cotations.",
        },
        { status: 400 }
      )
    }
  }

  let created = 0
  let already = 0

  for (const a of assignments) {
    const existing = await prisma.gradeEntryLock.findFirst({
      where: {
        schoolId: ctx.schoolId,
        classId,
        subjectId: a.subjectId,
        kind,
        ...(kind === "PERIOD"
          ? { periodId: periodId! }
          : { periodGroupId: periodGroupId! }),
        unlockedAt: null,
      },
    })
    if (existing) {
      already += 1
      continue
    }
    await prisma.gradeEntryLock.create({
      data: {
        schoolId: ctx.schoolId,
        classId,
        subjectId: a.subjectId,
        kind,
        periodId: kind === "PERIOD" ? periodId : null,
        periodGroupId: kind === "EXAM" ? periodGroupId : null,
        courseAssignmentId: a.id,
        lockedByUserId: ctx.userId,
      },
    })
    created += 1
  }

  return NextResponse.json({
    ok: true,
    created,
    already,
    message:
      created > 0
        ? `Résultats envoyés à l'administration (${created} branche${created > 1 ? "s" : ""})`
        : already > 0
          ? "Déjà envoyé pour cet événement"
          : "Aucune branche à envoyer",
  })
}
