import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { normalizeGradeStream } from "@/lib/grading/degree"
import { assertPeriodNotLocked, assertExamNotLocked } from "@/lib/grading/grade-locks"

async function getOwnedAssignment(teacherId: number, schoolId: number, yearId: number, assignmentId: number) {
  return prisma.courseAssignment.findFirst({
    where: { id: assignmentId, teacherId, schoolId, yearId, isActive: true },
  })
}

export async function POST(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!ctx.yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const body = await req.json()
  const assignmentId = parseInt(body.assignmentId, 10)
  const periodId = parseInt(body.periodId, 10)
  const label = String(body.label || "").trim()
  const maxPoints = Number(body.maxPoints)
  const dateStr = String(body.date || "").trim()

  if (!assignmentId || !periodId || !label || !Number.isFinite(maxPoints) || maxPoints <= 0 || !dateStr) {
    return NextResponse.json(
      { error: "assignmentId, periodId, label, date et maxPoints (>0) requis" },
      { status: 400 }
    )
  }

  const assignment = await getOwnedAssignment(ctx.teacherId, ctx.schoolId, ctx.yearId, assignmentId)
  if (!assignment) {
    return NextResponse.json({ error: "Cours non assigné" }, { status: 404 })
  }

  const period = await prisma.period.findFirst({
    where: { id: periodId, periodGroup: { cycle: { schoolId: ctx.schoolId } } },
  })
  if (!period) {
    return NextResponse.json({ error: "Période introuvable" }, { status: 404 })
  }

  const periodLock = await assertPeriodNotLocked({
    schoolId: ctx.schoolId,
    classId: assignment.classId,
    subjectId: assignment.subjectId,
    periodId,
  })
  if (periodLock.locked) {
    return NextResponse.json({ error: periodLock.message }, { status: 423 })
  }

  const column = await prisma.evaluationColumn.create({
    data: {
      courseAssignmentId: assignmentId,
      periodId,
      label,
      date: new Date(dateStr),
      maxPoints,
    },
  })

  return NextResponse.json({ column })
}

export async function PUT(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!ctx.yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const body = await req.json()
  const action = body.action as string

  if (action === "upsertGrades") {
    const assignmentId = parseInt(body.assignmentId, 10)
    const grades = Array.isArray(body.grades) ? body.grades : []
    const assignment = await getOwnedAssignment(ctx.teacherId, ctx.schoolId, ctx.yearId, assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: "Cours non assigné" }, { status: 404 })
    }

    // Verrou: si une colonne cible une période validée, bloquer
    const colIds = grades
      .map((r: { evaluationColumnId?: unknown }) => parseInt(String(r.evaluationColumnId ?? ""), 10))
      .filter((id: number) => Number.isFinite(id) && id > 0)
    if (colIds.length) {
      const cols = await prisma.evaluationColumn.findMany({
        where: { id: { in: colIds }, courseAssignmentId: assignmentId },
        select: { periodId: true },
      })
      const periodIds = [...new Set(cols.map((c) => c.periodId))]
      for (const pid of periodIds) {
        const lock = await assertPeriodNotLocked({
          schoolId: ctx.schoolId,
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          periodId: pid,
        })
        if (lock.locked) {
          return NextResponse.json({ error: lock.message }, { status: 423 })
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const row of grades) {
        const evaluationColumnId = parseInt(row.evaluationColumnId, 10)
        const enrollmentId = parseInt(row.enrollmentId, 10)
        const raw = row.pointsObtained
        if (!evaluationColumnId || !enrollmentId) continue

        const column = await tx.evaluationColumn.findFirst({
          where: { id: evaluationColumnId, courseAssignmentId: assignmentId },
        })
        if (!column) continue

        if (raw === null || raw === undefined || raw === "") {
          await tx.grade.deleteMany({
            where: { evaluationColumnId, enrollmentId },
          })
          continue
        }

        const pointsObtained = Number(raw)
        if (!Number.isFinite(pointsObtained) || pointsObtained < 0) continue
        if (pointsObtained > column.maxPoints) {
          continue
        }

        const enrollment = await tx.enrollment.findFirst({
          where: {
            id: enrollmentId,
            classId: assignment.classId,
            yearId: ctx.yearId!,
            status: "ACTIVE",
          },
        })
        if (!enrollment) continue

        await tx.grade.upsert({
          where: {
            evaluationColumnId_enrollmentId: { evaluationColumnId, enrollmentId },
          },
          create: { evaluationColumnId, enrollmentId, pointsObtained },
          update: { pointsObtained },
        })
      }
    })

    return NextResponse.json({ ok: true })
  }

  if (action === "upsertExam") {
    const assignmentId = parseInt(body.assignmentId, 10)
    const periodGroupId = parseInt(body.periodGroupId, 10)
    const grades = Array.isArray(body.grades) ? body.grades : []
    const assignment = await getOwnedAssignment(ctx.teacherId, ctx.schoolId, ctx.yearId, assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: "Cours non assigné" }, { status: 404 })
    }

    const examLock = await assertExamNotLocked({
      schoolId: ctx.schoolId,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      periodGroupId,
    })
    if (examLock.locked) {
      return NextResponse.json({ error: examLock.message }, { status: 423 })
    }

    const cls = await prisma.class.findFirst({
      where: { id: assignment.classId },
      select: { section: true, level: true, stream: true },
    })
    if (!cls) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 })
    }

    const gradeStream =
      cls.section === "Humanités" ? normalizeGradeStream(cls.stream) : ""

    const examMax = await prisma.subjectExamMax.findUnique({
      where: {
        subjectId_section_level_stream_periodGroupId: {
          subjectId: assignment.subjectId,
          section: cls.section,
          level: cls.level,
          stream: gradeStream,
          periodGroupId,
        },
      },
    })
    if (!examMax) {
      return NextResponse.json(
        {
          error: gradeStream
            ? `Maximum officiel d'examen non défini pour ${cls.level} ${cls.section} — ${gradeStream}`
            : "Maximum officiel d'examen non défini pour ce degré",
        },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      for (const row of grades) {
        const enrollmentId = parseInt(row.enrollmentId, 10)
        if (!enrollmentId) continue
        const raw = row.pointsObtained

        if (raw === null || raw === undefined || raw === "") {
          await tx.examGrade.deleteMany({
            where: {
              enrollmentId,
              subjectId: assignment.subjectId,
              periodGroupId,
            },
          })
          continue
        }

        const pointsObtained = Number(raw)
        if (!Number.isFinite(pointsObtained) || pointsObtained < 0) continue
        if (pointsObtained > examMax.maxPoints) {
          continue
        }

        await tx.examGrade.upsert({
          where: {
            enrollmentId_subjectId_periodGroupId: {
              enrollmentId,
              subjectId: assignment.subjectId,
              periodGroupId,
            },
          },
          create: {
            enrollmentId,
            subjectId: assignment.subjectId,
            periodGroupId,
            courseAssignmentId: assignmentId,
            pointsObtained,
          },
          update: { pointsObtained, courseAssignmentId: assignmentId },
        })
      }
    })

    return NextResponse.json({ ok: true })
  }

  if (action === "updateColumn") {
    const columnId = parseInt(body.columnId, 10)
    const assignmentId = parseInt(body.assignmentId, 10)
    const assignment = await getOwnedAssignment(ctx.teacherId, ctx.schoolId, ctx.yearId, assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: "Cours non assigné" }, { status: 404 })
    }

    const column = await prisma.evaluationColumn.findFirst({
      where: { id: columnId, courseAssignmentId: assignmentId },
    })
    if (!column) {
      return NextResponse.json({ error: "Colonne introuvable" }, { status: 404 })
    }

    const data: { label?: string; date?: Date; maxPoints?: number } = {}
    if (body.label != null) data.label = String(body.label).trim()
    if (body.date) data.date = new Date(String(body.date))
    if (body.maxPoints != null) {
      const maxPoints = Number(body.maxPoints)
      if (!Number.isFinite(maxPoints) || maxPoints <= 0) {
        return NextResponse.json({ error: "maxPoints invalide" }, { status: 400 })
      }
      data.maxPoints = maxPoints
    }

    const updated = await prisma.evaluationColumn.update({
      where: { id: columnId },
      data,
    })
    return NextResponse.json({ column: updated })
  }

  if (action === "deleteColumn") {
    const columnId = parseInt(body.columnId, 10)
    const assignmentId = parseInt(body.assignmentId, 10)
    const assignment = await getOwnedAssignment(ctx.teacherId, ctx.schoolId, ctx.yearId, assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: "Cours non assigné" }, { status: 404 })
    }

    const column = await prisma.evaluationColumn.findFirst({
      where: { id: columnId, courseAssignmentId: assignmentId },
    })
    if (!column) {
      return NextResponse.json({ error: "Colonne introuvable" }, { status: 404 })
    }

    await prisma.evaluationColumn.delete({ where: { id: columnId } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Action non supportée" }, { status: 400 })
}
