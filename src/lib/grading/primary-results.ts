import { prisma } from "@/lib/prisma"
import {
  bulletinEventKey,
  deriveClassSubmissionStatus,
  type ClassSubmissionStatus,
} from "@/lib/grading/class-submission-status"

export type PrimaryResultsEvent = {
  kind: "PERIOD" | "EXAM"
  periodId: number | null
  periodGroupId: number | null
  label: string
  groupName: string
}

export type PrimaryClassResultRow = {
  classId: number
  name: string
  level: string
  letter: string
  titulaireName: string | null
  status: ClassSubmissionStatus
  lockedCount: number
  totalCount: number
  missingBranchNames: string[]
  publishedAt: string | null
}

function titulaireDisplayName(t: {
  lastName: string
  middleName: string
  firstName: string
} | null): string | null {
  if (!t) return null
  return [t.lastName, t.middleName, t.firstName].filter(Boolean).join(" ").trim() || null
}

/** Build selectable period/exam events from a PRIMARY cycle. */
export function buildPrimaryEvents(
  cycle: {
    periodGroups: Array<{
      id: number
      name: string
      sortOrder: number
      hasExam: boolean
      periods: Array<{ id: number; name: string; sortOrder: number }>
    }>
  } | null
): PrimaryResultsEvent[] {
  if (!cycle) return []
  const events: PrimaryResultsEvent[] = []
  for (const g of cycle.periodGroups) {
    for (const p of g.periods) {
      events.push({
        kind: "PERIOD",
        periodId: p.id,
        periodGroupId: null,
        label: p.name,
        groupName: g.name,
      })
    }
    if (g.hasExam) {
      events.push({
        kind: "EXAM",
        periodId: null,
        periodGroupId: g.id,
        label: `Examen — ${g.name}`,
        groupName: g.name,
      })
    }
  }
  return events
}

export async function loadPrimaryClassResults(params: {
  schoolId: number
  yearId: number | null
  kind: "PERIOD" | "EXAM"
  periodId?: number | null
  periodGroupId?: number | null
}): Promise<PrimaryClassResultRow[]> {
  const { schoolId, yearId, kind } = params
  const periodId = kind === "PERIOD" ? params.periodId ?? null : null
  const periodGroupId = kind === "EXAM" ? params.periodGroupId ?? null : null
  const eventKey = bulletinEventKey(kind, periodId, periodGroupId)

  const classes = await prisma.class.findMany({
    where: { schoolId, section: "Primaire" },
    include: {
      titulaireTeacher: {
        select: { lastName: true, middleName: true, firstName: true },
      },
    },
    orderBy: [{ level: "asc" }, { letter: "asc" }, { name: "asc" }],
  })

  const classIds = classes.map((c) => c.id)
  if (classIds.length === 0) return []

  const assignments = yearId
    ? await prisma.courseAssignment.findMany({
        where: {
          schoolId,
          yearId,
          isActive: true,
          classId: { in: classIds },
        },
        include: { subject: { select: { id: true, name: true } } },
      })
    : []

  const assignmentsByClass = new Map<
    number,
    Array<{ subjectId: number; subjectName: string }>
  >()
  for (const a of assignments) {
    const list = assignmentsByClass.get(a.classId) || []
    list.push({ subjectId: a.subject.id, subjectName: a.subject.name })
    assignmentsByClass.set(a.classId, list)
  }

  const [locks, publications] = await Promise.all([
    prisma.gradeEntryLock.findMany({
      where: {
        schoolId,
        classId: { in: classIds },
        kind,
        unlockedAt: null,
        ...(kind === "PERIOD" ? { periodId: periodId ?? undefined } : {}),
        ...(kind === "EXAM" ? { periodGroupId: periodGroupId ?? undefined } : {}),
      },
      select: { classId: true, subjectId: true },
    }),
    prisma.bulletinPublication.findMany({
      where: {
        schoolId,
        classId: { in: classIds },
        eventKey,
      },
      select: { classId: true, publishedAt: true },
    }),
  ])

  const lockedByClass = new Map<number, Set<number>>()
  for (const lock of locks) {
    let set = lockedByClass.get(lock.classId)
    if (!set) {
      set = new Set()
      lockedByClass.set(lock.classId, set)
    }
    set.add(lock.subjectId)
  }

  const publishedByClass = new Map(
    publications.map((p) => [p.classId, p.publishedAt.toISOString()] as const)
  )

  return classes.map((cls) => {
    const classAssignments = assignmentsByClass.get(cls.id) || []
    const branches = new Map<number, string>()
    for (const a of classAssignments) {
      branches.set(a.subjectId, a.subjectName)
    }
    const lockedSet = lockedByClass.get(cls.id) || new Set<number>()
    let lockedCount = 0
    const missingBranchNames: string[] = []
    for (const [subjectId, name] of branches) {
      if (lockedSet.has(subjectId)) lockedCount += 1
      else missingBranchNames.push(name)
    }
    missingBranchNames.sort((a, b) => a.localeCompare(b, "fr"))

    const derived = deriveClassSubmissionStatus({
      totalBranches: branches.size,
      lockedBranches: lockedCount,
    })

    return {
      classId: cls.id,
      name: cls.name,
      level: cls.level,
      letter: cls.letter,
      titulaireName: titulaireDisplayName(cls.titulaireTeacher),
      status: derived.status,
      lockedCount: derived.lockedCount,
      totalCount: derived.totalCount,
      missingBranchNames,
      publishedAt: publishedByClass.get(cls.id) ?? null,
    }
  })
}
