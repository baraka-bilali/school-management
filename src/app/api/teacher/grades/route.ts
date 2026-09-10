import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { findCycleForSection } from "@/lib/grading/cycles"
import { normalizePeriodResult, roundGrade } from "@/lib/grading/normalize"

/**
 * GET ?assignmentId=&periodId=
 * Contexte de saisie : élèves, colonnes, notes, max officiel, aperçu normalisé.
 */
export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!ctx.yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const assignmentId = parseInt(searchParams.get("assignmentId") || "", 10)
  const periodIdParam = searchParams.get("periodId")
  const periodId = periodIdParam ? parseInt(periodIdParam, 10) : null

  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId requis" }, { status: 400 })
  }

  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      id: assignmentId,
      teacherId: ctx.teacherId,
      schoolId: ctx.schoolId,
      yearId: ctx.yearId,
      isActive: true,
    },
    include: {
      subject: { select: { id: true, name: true, code: true, color: true } },
      class: { select: { id: true, name: true, section: true, level: true, letter: true } },
    },
  })

  if (!assignment) {
    return NextResponse.json({ error: "Cours non assigné" }, { status: 404 })
  }

  const cycle = await findCycleForSection(ctx.schoolId, assignment.class.section)
  if (!cycle) {
    return NextResponse.json(
      {
        error:
          "Aucun cycle d'évaluation configuré pour cette section. Demandez à l'admin de configurer Notes & Bulletins.",
      },
      { status: 400 }
    )
  }

  const periods = cycle.periodGroups.flatMap((g) =>
    g.periods.map((p) => ({
      id: p.id,
      name: p.name,
      sortOrder: p.sortOrder,
      periodGroupId: g.id,
      periodGroupName: g.name,
      hasExam: g.hasExam,
    }))
  )

  const selectedPeriodId = periodId && periods.some((p) => p.id === periodId)
    ? periodId
    : periods[0]?.id ?? null

  const selectedPeriodMeta = periods.find((p) => p.id === selectedPeriodId) || null
  const selectedGroup = cycle.periodGroups.find(
    (g) => g.id === selectedPeriodMeta?.periodGroupId
  )

  const [enrollments, columns, officialPeriodMax, officialExamMax, examGrade] =
    await Promise.all([
      prisma.enrollment.findMany({
        where: {
          classId: assignment.classId,
          yearId: ctx.yearId,
          status: "ACTIVE",
        },
        include: {
          student: {
            select: {
              id: true,
              permanentCode: true,
              lastName: true,
              middleName: true,
              firstName: true,
            },
          },
        },
        orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
      }),
      selectedPeriodId
        ? prisma.evaluationColumn.findMany({
            where: { courseAssignmentId: assignmentId, periodId: selectedPeriodId },
            include: { grades: true },
            orderBy: [{ date: "asc" }, { id: "asc" }],
          })
        : Promise.resolve([]),
      selectedPeriodId
        ? prisma.subjectPeriodMax.findUnique({
            where: {
              subjectId_section_level_periodId: {
                subjectId: assignment.subjectId,
                section: assignment.class.section,
                level: assignment.class.level,
                periodId: selectedPeriodId,
              },
            },
          })
        : Promise.resolve(null),
      selectedGroup
        ? prisma.subjectExamMax.findUnique({
            where: {
              subjectId_section_level_periodGroupId: {
                subjectId: assignment.subjectId,
                section: assignment.class.section,
                level: assignment.class.level,
                periodGroupId: selectedGroup.id,
              },
            },
          })
        : Promise.resolve(null),
      selectedGroup
        ? prisma.examGrade.findMany({
            where: {
              courseAssignmentId: assignmentId,
              periodGroupId: selectedGroup.id,
            },
          })
        : Promise.resolve([]),
    ])

  const students = enrollments.map((e) => ({
    enrollmentId: e.id,
    studentId: e.student.id,
    code: e.code || e.student.permanentCode,
    lastName: e.student.lastName,
    middleName: e.student.middleName,
    firstName: e.student.firstName,
  }))

  const columnPayload = columns.map((c) => ({
    id: c.id,
    label: c.label,
    date: c.date.toISOString().slice(0, 10),
    maxPoints: c.maxPoints,
    grades: Object.fromEntries(
      c.grades.map((g) => [String(g.enrollmentId), g.pointsObtained])
    ),
  }))

  const sumColumnMax = columns.reduce((s, c) => s + c.maxPoints, 0)
  const officialMax = officialPeriodMax?.maxPoints ?? null

  const normalizedByEnrollment: Record<string, number | null> = {}
  for (const s of students) {
    let sumObtained = 0
    let hasAny = false
    for (const c of columns) {
      const g = c.grades.find((x) => x.enrollmentId === s.enrollmentId)
      if (g) {
        sumObtained += g.pointsObtained
        hasAny = true
      }
    }
    if (!hasAny || officialMax == null || sumColumnMax <= 0) {
      normalizedByEnrollment[String(s.enrollmentId)] = null
    } else {
      const n = normalizePeriodResult({
        sumObtained,
        sumColumnMax,
        officialMax,
      })
      normalizedByEnrollment[String(s.enrollmentId)] =
        n == null ? null : roundGrade(n)
    }
  }

  const examByEnrollment = Object.fromEntries(
    examGrade.map((g) => [String(g.enrollmentId), g.pointsObtained])
  )

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      subject: assignment.subject,
      class: assignment.class,
    },
    cycle: { id: cycle.id, name: cycle.name, kind: cycle.kind },
    periods,
    selectedPeriodId,
    selectedPeriodGroup: selectedGroup
      ? {
          id: selectedGroup.id,
          name: selectedGroup.name,
          hasExam: selectedGroup.hasExam,
        }
      : null,
    officialPeriodMax: officialMax,
    officialExamMax: officialExamMax?.maxPoints ?? null,
    students,
    columns: columnPayload,
    normalizedByEnrollment,
    examByEnrollment,
  })
}
