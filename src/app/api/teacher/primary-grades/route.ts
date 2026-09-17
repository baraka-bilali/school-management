import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { teacherHasClassAccess } from "@/lib/teacher-classes"
import { findCycleForSection } from "@/lib/grading/cycles"
import {
  derivePrimaryMaxima,
  primaryDegreeCodeForLevel,
} from "@/lib/grading/primary-maxima"
import { normalizePeriodResult, roundGrade } from "@/lib/grading/normalize"
import { PRIMARY_PERIOD_COLUMN_LABEL } from "@/lib/grading/primary-cotation"

/**
 * GET ?classId=&periodGroupId?
 * Tableau de cotation primaire : branches × élèves × périodes/examens.
 */
export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!ctx.yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const classId = parseInt(searchParams.get("classId") || "", 10)
  const periodGroupIdParam = searchParams.get("periodGroupId")
  const periodGroupId = periodGroupIdParam
    ? parseInt(periodGroupIdParam, 10)
    : null

  if (!classId) {
    return NextResponse.json({ error: "classId requis" }, { status: 400 })
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
    select: {
      id: true,
      name: true,
      level: true,
      section: true,
      letter: true,
    },
  })
  if (!classRow) {
    return NextResponse.json(
      { error: "Classe primaire introuvable" },
      { status: 404 }
    )
  }

  const cycle = await findCycleForSection(ctx.schoolId, "Primaire")
  if (!cycle) {
    return NextResponse.json(
      { error: "Cycle d'évaluation primaire non configuré" },
      { status: 400 }
    )
  }

  const trimestres = cycle.periodGroups.map((g) => ({
    id: g.id,
    name: g.name,
    sortOrder: g.sortOrder,
    hasExam: g.hasExam,
    periods: g.periods
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sortOrder: p.sortOrder,
      })),
  }))

  const selectedTrimestre =
    trimestres.find((t) => t.id === periodGroupId) || trimestres[0] || null

  const degreeCode = primaryDegreeCodeForLevel(classRow.level)

  const [assignments, enrollments, curriculumBranches] = await Promise.all([
    prisma.courseAssignment.findMany({
      where: {
        teacherId: ctx.teacherId,
        schoolId: ctx.schoolId,
        yearId: ctx.yearId,
        classId,
        isActive: true,
      },
      include: { subject: { select: { id: true, name: true } } },
    }),
    prisma.enrollment.findMany({
      where: { classId, yearId: ctx.yearId, status: "ACTIVE" },
      include: {
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
      orderBy: [
        { student: { lastName: "asc" } },
        { student: { firstName: "asc" } },
      ],
    }),
    degreeCode
      ? prisma.primaryBranch.findMany({
          where: {
            isActive: true,
            subjectId: { not: null },
            domain: {
              degree: { schoolId: ctx.schoolId, code: degreeCode, isActive: true },
            },
          },
          include: {
            domain: { select: { name: true, sortOrder: true } },
            group: { select: { name: true, sortOrder: true } },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ])

  const metaBySubject = new Map<
    number,
    {
      name: string
      domainName: string
      groupName: string | null
      sortKey: string
      maxPeriode: number
      maxExamen: number
      maxTrimestre: number
      maxAnnuel: number
    }
  >()
  for (const b of curriculumBranches) {
    if (!b.subjectId || metaBySubject.has(b.subjectId)) continue
    const maxima = derivePrimaryMaxima(b.maxPeriode, {
      maxExamenOverride: b.maxExamenOverride,
      maxTrimestreOverride: b.maxTrimestreOverride,
      maxAnnuelOverride: b.maxAnnuelOverride,
    })
    metaBySubject.set(b.subjectId, {
      name: b.name,
      domainName: b.domain.name,
      groupName: b.group?.name ?? null,
      sortKey: [
        String(b.domain.sortOrder).padStart(4, "0"),
        String(b.group?.sortOrder ?? 999).padStart(4, "0"),
        String(b.sortOrder).padStart(4, "0"),
        b.name,
      ].join("|"),
      ...maxima,
    })
  }

  const branches = assignments
    .map((a) => {
      const meta = metaBySubject.get(a.subjectId)
      const maxima = meta ?? {
        name: a.subject.name,
        domainName: "Autres",
        groupName: null,
        sortKey: `9999|9999|9999|${a.subject.name}`,
        ...derivePrimaryMaxima(10),
      }
      return {
        assignmentId: a.id,
        subjectId: a.subjectId,
        name: meta?.name ?? a.subject.name,
        domainName: maxima.domainName,
        groupName: maxima.groupName,
        sortKey: maxima.sortKey,
        maxPeriode: maxima.maxPeriode,
        maxExamen: maxima.maxExamen,
        maxTrimestre: maxima.maxTrimestre,
        maxAnnuel: maxima.maxAnnuel,
      }
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  const students = enrollments.map((e) => ({
    enrollmentId: e.id,
    studentId: e.student.id,
    code: e.code || e.student.permanentCode,
    lastName: e.student.lastName,
    middleName: e.student.middleName,
    firstName: e.student.firstName,
    gender: e.student.gender,
    fullName: [e.student.lastName, e.student.middleName, e.student.firstName]
      .filter(Boolean)
      .join(" "),
  }))

  const assignmentIds = branches.map((b) => b.assignmentId)
  const allPeriodIds = trimestres.flatMap((t) => t.periods.map((p) => p.id))
  const allGroupIds = trimestres.map((t) => t.id)

  const [columns, examGrades, locks] = await Promise.all([
    assignmentIds.length && allPeriodIds.length
      ? prisma.evaluationColumn.findMany({
          where: {
            courseAssignmentId: { in: assignmentIds },
            periodId: { in: allPeriodIds },
            label: PRIMARY_PERIOD_COLUMN_LABEL,
          },
          include: { grades: true },
        })
      : Promise.resolve([]),
    assignmentIds.length && allGroupIds.length
      ? prisma.examGrade.findMany({
          where: {
            courseAssignmentId: { in: assignmentIds },
            periodGroupId: { in: allGroupIds },
          },
        })
      : Promise.resolve([]),
    prisma.gradeEntryLock.findMany({
      where: {
        schoolId: ctx.schoolId,
        classId,
        unlockedAt: null,
        OR: [
          { kind: "PERIOD", periodId: { in: allPeriodIds } },
          { kind: "EXAM", periodGroupId: { in: allGroupIds } },
        ],
      },
    }),
  ])

  /** periodScores[assignmentId][periodId][enrollmentId] = normalized score */
  const periodScores: Record<
    string,
    Record<string, Record<string, number | null>>
  > = {}
  const examScores: Record<string, Record<string, Record<string, number | null>>> =
    {}

  for (const b of branches) {
    periodScores[String(b.assignmentId)] = {}
    examScores[String(b.assignmentId)] = {}
    for (const t of trimestres) {
      for (const p of t.periods) {
        periodScores[String(b.assignmentId)][String(p.id)] = {}
      }
      examScores[String(b.assignmentId)][String(t.id)] = {}
    }
  }

  for (const b of branches) {
    for (const t of trimestres) {
      for (const p of t.periods) {
        const cols = columns.filter(
          (c) =>
            c.courseAssignmentId === b.assignmentId && c.periodId === p.id
        )
        const sumMax = cols.reduce((s, c) => s + c.maxPoints, 0)
        for (const s of students) {
          let sum = 0
          let has = false
          for (const c of cols) {
            const g = c.grades.find((x) => x.enrollmentId === s.enrollmentId)
            if (g) {
              sum += g.pointsObtained
              has = true
            }
          }
          let value: number | null = null
          if (has && sumMax > 0 && b.maxPeriode > 0) {
            const n = normalizePeriodResult({
              sumObtained: sum,
              sumColumnMax: sumMax,
              officialMax: b.maxPeriode,
            })
            value = n == null ? null : roundGrade(n)
          }
          periodScores[String(b.assignmentId)][String(p.id)][
            String(s.enrollmentId)
          ] = value
        }
      }
      for (const s of students) {
        const eg = examGrades.find(
          (x) =>
            x.courseAssignmentId === b.assignmentId &&
            x.periodGroupId === t.id &&
            x.enrollmentId === s.enrollmentId
        )
        examScores[String(b.assignmentId)][String(t.id)][
          String(s.enrollmentId)
        ] = eg ? roundGrade(eg.pointsObtained) : null
      }
    }
  }

  /** Verrouillage par branche : assignmentId → periodId|periodGroupId → bool */
  const lockedPeriodsByAssignment: Record<string, Record<string, boolean>> = {}
  const lockedExamsByAssignment: Record<string, Record<string, boolean>> = {}
  for (const b of branches) {
    const aKey = String(b.assignmentId)
    lockedPeriodsByAssignment[aKey] = {}
    lockedExamsByAssignment[aKey] = {}
    for (const p of allPeriodIds) {
      lockedPeriodsByAssignment[aKey][String(p)] = locks.some(
        (l) =>
          l.kind === "PERIOD" &&
          l.periodId === p &&
          l.subjectId === b.subjectId
      )
    }
    for (const g of allGroupIds) {
      lockedExamsByAssignment[aKey][String(g)] = locks.some(
        (l) =>
          l.kind === "EXAM" &&
          l.periodGroupId === g &&
          l.subjectId === b.subjectId
      )
    }
  }

  /** Période/examen « envoyé » quand toutes les branches sont verrouillées */
  const lockedPeriods: Record<string, boolean> = {}
  const lockedExams: Record<string, boolean> = {}
  for (const p of allPeriodIds) {
    lockedPeriods[String(p)] =
      branches.length > 0 &&
      branches.every(
        (b) => lockedPeriodsByAssignment[String(b.assignmentId)][String(p)]
      )
  }
  for (const g of allGroupIds) {
    lockedExams[String(g)] =
      branches.length > 0 &&
      branches.every(
        (b) => lockedExamsByAssignment[String(b.assignmentId)][String(g)]
      )
  }

  return NextResponse.json({
    class: classRow,
    yearId: ctx.yearId,
    trimestres,
    selectedPeriodGroupId: selectedTrimestre?.id ?? null,
    branches,
    students,
    periodScores,
    examScores,
    lockedPeriods,
    lockedExams,
    lockedPeriodsByAssignment,
    lockedExamsByAssignment,
  })
}

/**
 * PUT — enregistrer notes période / examen (saisie directe sur maxima officiels).
 * body: {
 *   classId,
 *   periodGrades?: [{ assignmentId, periodId, enrollmentId, pointsObtained }],
 *   examGrades?: [{ assignmentId, periodGroupId, enrollmentId, pointsObtained }]
 * }
 */
export async function PUT(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!ctx.yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const body = await req.json()
  const classId = parseInt(body.classId, 10)
  if (!classId) {
    return NextResponse.json({ error: "classId requis" }, { status: 400 })
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

  const periodGrades = Array.isArray(body.periodGrades)
    ? (body.periodGrades as Array<{
        assignmentId: number
        periodId: number
        enrollmentId: number
        pointsObtained: number | null
      }>)
    : []
  const examGrades = Array.isArray(body.examGrades)
    ? (body.examGrades as Array<{
        assignmentId: number
        periodGroupId: number
        enrollmentId: number
        pointsObtained: number | null
      }>)
    : []

  if (periodGrades.length === 0 && examGrades.length === 0) {
    return NextResponse.json({ error: "Aucune note à enregistrer" }, { status: 400 })
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
  const owned = new Map(assignments.map((a) => [a.id, a]))

  // Period grades: ensure single column max=official, upsert grade
  for (const row of periodGrades) {
    const assignment = owned.get(Number(row.assignmentId))
    if (!assignment) {
      return NextResponse.json(
        { error: `Cours ${row.assignmentId} non assigné` },
        { status: 403 }
      )
    }

    const lock = await prisma.gradeEntryLock.findFirst({
      where: {
        schoolId: ctx.schoolId,
        classId,
        subjectId: assignment.subjectId,
        kind: "PERIOD",
        periodId: Number(row.periodId),
        unlockedAt: null,
      },
    })
    if (lock) {
      return NextResponse.json(
        { error: "Période verrouillée — déverrouillez ou contactez l'admin" },
        { status: 423 }
      )
    }

    const classForMax = await prisma.class.findFirst({
      where: { id: classId },
      select: { level: true },
    })
    const degreeCode = primaryDegreeCodeForLevel(classForMax?.level || "")
    const branchMax = degreeCode
      ? await prisma.primaryBranch.findFirst({
          where: {
            subjectId: assignment.subjectId,
            isActive: true,
            domain: {
              degree: { schoolId: ctx.schoolId, code: degreeCode, isActive: true },
            },
          },
          select: {
            maxPeriode: true,
            maxExamenOverride: true,
            maxTrimestreOverride: true,
            maxAnnuelOverride: true,
          },
        })
      : null
    const officialMax = branchMax
      ? derivePrimaryMaxima(branchMax.maxPeriode, {
          maxExamenOverride: branchMax.maxExamenOverride,
          maxTrimestreOverride: branchMax.maxTrimestreOverride,
          maxAnnuelOverride: branchMax.maxAnnuelOverride,
        }).maxPeriode
      : (
          await prisma.subjectPeriodMax.findFirst({
            where: {
              subjectId: assignment.subjectId,
              section: "Primaire",
              periodId: Number(row.periodId),
              schoolId: ctx.schoolId,
            },
          })
        )?.maxPoints ?? 10

    let column = await prisma.evaluationColumn.findFirst({
      where: {
        courseAssignmentId: assignment.id,
        periodId: Number(row.periodId),
        label: PRIMARY_PERIOD_COLUMN_LABEL,
      },
    })
    if (!column) {
      column = await prisma.evaluationColumn.create({
        data: {
          courseAssignmentId: assignment.id,
          periodId: Number(row.periodId),
          label: PRIMARY_PERIOD_COLUMN_LABEL,
          date: new Date(),
          maxPoints: officialMax,
        },
      })
    } else if (column.maxPoints !== officialMax) {
      column = await prisma.evaluationColumn.update({
        where: { id: column.id },
        data: { maxPoints: officialMax },
      })
    }

    const pts = row.pointsObtained
    if (pts == null || pts === ("" as unknown)) {
      await prisma.grade.deleteMany({
        where: {
          evaluationColumnId: column.id,
          enrollmentId: Number(row.enrollmentId),
        },
      })
    } else {
      const value = Number(pts)
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ error: "Note invalide" }, { status: 400 })
      }
      await prisma.grade.upsert({
        where: {
          evaluationColumnId_enrollmentId: {
            evaluationColumnId: column.id,
            enrollmentId: Number(row.enrollmentId),
          },
        },
        create: {
          evaluationColumnId: column.id,
          enrollmentId: Number(row.enrollmentId),
          pointsObtained: Math.min(value, officialMax),
        },
        update: { pointsObtained: Math.min(value, officialMax) },
      })
    }
  }

  for (const row of examGrades) {
    const assignment = owned.get(Number(row.assignmentId))
    if (!assignment) {
      return NextResponse.json(
        { error: `Cours ${row.assignmentId} non assigné` },
        { status: 403 }
      )
    }
    const lock = await prisma.gradeEntryLock.findFirst({
      where: {
        schoolId: ctx.schoolId,
        classId,
        subjectId: assignment.subjectId,
        kind: "EXAM",
        periodGroupId: Number(row.periodGroupId),
        unlockedAt: null,
      },
    })
    if (lock) {
      return NextResponse.json(
        { error: "Examen verrouillé — déverrouillez ou contactez l'admin" },
        { status: 423 }
      )
    }

    const classForExamMax = await prisma.class.findFirst({
      where: { id: classId },
      select: { level: true },
    })
    const examDegreeCode = primaryDegreeCodeForLevel(classForExamMax?.level || "")
    const examBranchMax = examDegreeCode
      ? await prisma.primaryBranch.findFirst({
          where: {
            subjectId: assignment.subjectId,
            isActive: true,
            domain: {
              degree: {
                schoolId: ctx.schoolId,
                code: examDegreeCode,
                isActive: true,
              },
            },
          },
          select: {
            maxPeriode: true,
            maxExamenOverride: true,
            maxTrimestreOverride: true,
            maxAnnuelOverride: true,
          },
        })
      : null
    const derivedExamMax = examBranchMax
      ? derivePrimaryMaxima(examBranchMax.maxPeriode, {
          maxExamenOverride: examBranchMax.maxExamenOverride,
          maxTrimestreOverride: examBranchMax.maxTrimestreOverride,
          maxAnnuelOverride: examBranchMax.maxAnnuelOverride,
        }).maxExamen
      : null

    const maxRow = await prisma.subjectExamMax.findFirst({
      where: {
        subjectId: assignment.subjectId,
        section: "Primaire",
        periodGroupId: Number(row.periodGroupId),
        schoolId: ctx.schoolId,
        ...(classForExamMax?.level ? { level: classForExamMax.level } : {}),
      },
    })
    const officialMax = maxRow?.maxPoints ?? derivedExamMax ?? 20

    const pts = row.pointsObtained
    if (pts == null || pts === ("" as unknown)) {
      await prisma.examGrade.deleteMany({
        where: {
          courseAssignmentId: assignment.id,
          periodGroupId: Number(row.periodGroupId),
          enrollmentId: Number(row.enrollmentId),
        },
      })
    } else {
      const value = Number(pts)
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ error: "Note d'examen invalide" }, { status: 400 })
      }
      await prisma.examGrade.upsert({
        where: {
          enrollmentId_subjectId_periodGroupId: {
            enrollmentId: Number(row.enrollmentId),
            subjectId: assignment.subjectId,
            periodGroupId: Number(row.periodGroupId),
          },
        },
        create: {
          enrollmentId: Number(row.enrollmentId),
          subjectId: assignment.subjectId,
          periodGroupId: Number(row.periodGroupId),
          courseAssignmentId: assignment.id,
          pointsObtained: Math.min(value, officialMax),
        },
        update: {
          pointsObtained: Math.min(value, officialMax),
          courseAssignmentId: assignment.id,
        },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
