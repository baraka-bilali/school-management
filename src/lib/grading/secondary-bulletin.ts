/**
 * Bulletin Éducation de Base (CTEB 7ème / 8ème).
 * 2 semestres × (2 périodes + examen) · annuel ×8 · repêchage (%).
 * Disposition inspirée du bulletin primaire ; multi-enseignants via CourseAssignment.
 */

import { prisma } from "@/lib/prisma"
import { normalizePeriodResult, roundGrade, sumPeriodGroupTotal } from "@/lib/grading/normalize"
import {
  CTEB_SECTION,
  ctebDegreeCodeForLevel,
  deriveCtebMaxima,
} from "@/lib/grading/cteb-maxima"
import {
  CTEB_DEGREE_CATALOG,
  flattenCtebBranches,
} from "@/lib/grading/cteb-curriculum-catalog"
import { ensureDefaultEvaluationCycles } from "@/lib/grading/cycles"
import { toDisplayCode } from "@/lib/student-fields"
import {
  applicationFromPercentage,
  computeBulletinVisibility,
  staffRevealEventKeys,
  type BulletinSchoolInfo,
  type BulletinPeriodCol,
  type BulletinTrimestreCol,
  type BulletinVisibility,
  type BulletinSummarySlice,
  type ConduiteCode,
} from "@/lib/grading/primary-bulletin"

export type SecondaryBulletinBranchLine = {
  subjectId: number
  assignmentId: number | null
  name: string
  domainName: string
  groupName: string | null
  maxPeriode: number
  maxExamen: number
  /** Alias max semestre (= 4× période) */
  maxSemestre: number
  maxAnnuel: number
  periodScores: Record<string, number | null>
  examScores: Record<string, number | null>
  /** Totaux semestre (périodes + examen) */
  semestreScores: Record<string, number | null>
  annualScore: number | null
  /** % repêchage (null = non saisi / non applicable) */
  repechagePercent: number | null
}

export type SecondaryBulletinDomainSubtotal = {
  domainName: string
  maxPeriode: number
  maxExamen: number
  maxSemestre: number
  maxAnnuel: number
  periodScores: Record<string, number | null>
  examScores: Record<string, number | null>
  semestreScores: Record<string, number | null>
  annualScore: number | null
}

export type SecondaryBulletinStudentPayload = {
  enrollmentId: number
  studentId: number
  code: string
  permanentCode: string
  lastName: string
  middleName: string
  firstName: string
  fullName: string
  gender: string
  birthDate: string | null
  birthPlace: string | null
  lines: SecondaryBulletinBranchLine[]
  domainSubtotals: SecondaryBulletinDomainSubtotal[]
  summaries: BulletinSummarySlice[]
  conduiteByPeriod: Record<string, ConduiteCode | null>
  /** Matières où un % de repêchage a été saisi */
  repechageSubjects: Array<{ subjectId: number; name: string; percentage: number }>
}

export type SecondaryBulletinPayload = {
  school: BulletinSchoolInfo
  yearName: string
  cycleKind: "SECONDARY"
  focusEvent: {
    kind: "PERIOD" | "EXAM"
    periodId: number | null
    periodGroupId: number | null
    label: string
    groupName: string
  }
  class: {
    id: number
    name: string
    level: string
    letter: string
    section: string
    titulaireName: string | null
  }
  /** Semestres (même forme que trimestres primaire) */
  semestres: BulletinTrimestreCol[]
  visibility: BulletinVisibility
  studentCount: number
  students: SecondaryBulletinStudentPayload[]
}

function displayName(parts: {
  lastName: string
  middleName: string
  firstName: string
}): string {
  return [parts.lastName, parts.middleName, parts.firstName]
    .filter(Boolean)
    .join(" ")
    .trim()
}

function shortPeriodLabel(name: string, indexInGroup: number): string {
  const m = name.match(/(\d+)/)
  if (m) return `${m[1]}P`
  return `P${indexInGroup + 1}`
}

function shortSemLabel(name: string, sortOrder: number): string {
  const m = name.match(/(\d+)/)
  if (m) return `S${m[1]}`
  return `S${sortOrder}`
}

function emptyScoreMap(keys: string[]): Record<string, number | null> {
  return Object.fromEntries(keys.map((k) => [k, null]))
}

function addScores(
  target: Record<string, number | null>,
  source: Record<string, number | null>,
  keys: string[]
) {
  for (const k of keys) {
    const v = source[k]
    if (v == null) continue
    target[k] = (target[k] ?? 0) + v
  }
}

function assignPlaces(
  rows: Array<{ enrollmentId: number; percentage: number | null }>
): Map<number, number | null> {
  const ranked = [...rows].sort((a, b) => {
    if (a.percentage == null && b.percentage == null) return 0
    if (a.percentage == null) return 1
    if (b.percentage == null) return -1
    return b.percentage - a.percentage
  })
  const places = new Map<number, number | null>()
  let lastPct: number | null = null
  let lastPlace = 0
  ranked.forEach((row, i) => {
    if (row.percentage == null) {
      places.set(row.enrollmentId, null)
      return
    }
    if (lastPct === null || row.percentage !== lastPct) {
      lastPlace = i + 1
      lastPct = row.percentage
    }
    places.set(row.enrollmentId, lastPlace)
  })
  return places
}

/**
 * Charge les bulletins CTEB (7ème / 8ème).
 * - audience "student" : notes selon BulletinPublication
 * - audience "staff" : aperçu jusqu'au focus (+ déjà publié)
 */
export async function loadSecondaryBulletins(params: {
  schoolId: number
  yearId: number
  classId: number
  kind: "PERIOD" | "EXAM"
  periodId?: number | null
  periodGroupId?: number | null
  enrollmentId?: number | null
  audience?: "student" | "staff"
}): Promise<SecondaryBulletinPayload> {
  const { schoolId, yearId, classId, kind } = params
  const audience = params.audience ?? "student"
  const focusPeriodId = kind === "PERIOD" ? params.periodId ?? null : null
  const focusPeriodGroupId = kind === "EXAM" ? params.periodGroupId ?? null : null
  const enrollmentFilter = params.enrollmentId ?? null

  const [school, year, cls, cycles, publications] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        nomEtablissement: true,
        adresse: true,
        ville: true,
        telephone: true,
        email: true,
        logoUrl: true,
        sealUrl: true,
        slogan: true,
      },
    }),
    prisma.academicYear.findUnique({
      where: { id: yearId },
      select: { name: true },
    }),
    prisma.class.findFirst({
      where: { id: classId, schoolId, section: CTEB_SECTION },
      include: {
        titulaireTeacher: {
          select: { lastName: true, middleName: true, firstName: true },
        },
      },
    }),
    ensureDefaultEvaluationCycles(schoolId),
    prisma.bulletinPublication.findMany({
      where: { schoolId, classId, yearId },
      select: { eventKey: true },
    }),
  ])

  if (!cls) throw new Error("Classe introuvable (Éducation de Base)")
  if (!year) throw new Error("Année scolaire introuvable")

  const secondaryCycle = cycles.find((c) => c.kind === "SECONDARY")
  if (!secondaryCycle) throw new Error("Cycle secondaire introuvable")

  const semestres: BulletinTrimestreCol[] = secondaryCycle.periodGroups
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => {
      const periods: BulletinPeriodCol[] = g.periods
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((p, i) => ({
          periodId: p.id,
          name: p.name,
          shortLabel: shortPeriodLabel(p.name, i),
          sortOrder: p.sortOrder,
        }))
      return {
        periodGroupId: g.id,
        name: g.name,
        shortLabel: shortSemLabel(g.name, g.sortOrder),
        sortOrder: g.sortOrder,
        hasExam: g.hasExam,
        periods,
      }
    })

  const publicationKeys = new Set(publications.map((p) => p.eventKey))
  const publishedKeys =
    audience === "staff"
      ? (() => {
          const keys = staffRevealEventKeys(
            semestres,
            kind,
            focusPeriodId,
            focusPeriodGroupId
          )
          for (const k of publicationKeys) keys.add(k)
          return keys
        })()
      : publicationKeys
  const visibility = computeBulletinVisibility(semestres, publishedKeys)

  let focusLabel = ""
  let focusGroupName = ""
  if (kind === "PERIOD" && focusPeriodId) {
    for (const t of semestres) {
      const p = t.periods.find((x) => x.periodId === focusPeriodId)
      if (p) {
        focusLabel = p.name
        focusGroupName = t.name
        break
      }
    }
  } else if (kind === "EXAM" && focusPeriodGroupId) {
    const t = semestres.find((x) => x.periodGroupId === focusPeriodGroupId)
    if (t) {
      focusLabel = `Examen — ${t.name}`
      focusGroupName = t.name
    }
  }
  if (!focusLabel) {
    const first = semestres[0]?.periods[0]
    focusLabel = first?.name || "Bulletin"
    focusGroupName = semestres[0]?.name || ""
  }

  const degreeCode = ctebDegreeCodeForLevel(cls.level)
  const degree =
    CTEB_DEGREE_CATALOG.find((d) => d.code === degreeCode) ??
    CTEB_DEGREE_CATALOG[0]
  const catalogBranches = flattenCtebBranches(degree)

  const allPeriodIds = semestres.flatMap((t) => t.periods.map((p) => p.periodId))
  const examGroupIds = semestres.filter((t) => t.hasExam).map((t) => t.periodGroupId)
  const periodKeyList = allPeriodIds.map(String)
  const examKeyList = examGroupIds.map(String)
  const semestreKeyList = semestres.map((t) => String(t.periodGroupId))

  const [allEnrollments, assignments, subjects] = await Promise.all([
    prisma.enrollment.findMany({
      where: { classId, yearId, status: "ACTIVE" },
      include: {
        student: {
          select: {
            id: true,
            permanentCode: true,
            lastName: true,
            middleName: true,
            firstName: true,
            gender: true,
            birthDate: true,
            birthPlace: true,
          },
        },
      },
      orderBy: [
        { student: { lastName: "asc" } },
        { student: { middleName: "asc" } },
        { student: { firstName: "asc" } },
      ],
    }),
    prisma.courseAssignment.findMany({
      where: { schoolId, yearId, classId, isActive: true },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.subject.findMany({
      where: {
        schoolId,
        code: { in: catalogBranches.map((b) => b.code) },
        isActive: true,
      },
      select: { id: true, code: true, name: true },
    }),
  ])

  const subjectByCode = new Map(subjects.map((s) => [s.code, s]))
  const assignmentBySubjectId = new Map(
    assignments.map((a) => [a.subjectId, a] as const)
  )

  type BranchRow = {
    subjectId: number
    assignmentId: number | null
    name: string
    domainName: string
    groupName: string | null
    sortKey: string
    maxPeriode: number
    maxExamen: number
    maxSemestre: number
    maxAnnuel: number
  }

  const branchRows: BranchRow[] = []
  let sortIdx = 0
  for (const b of catalogBranches) {
    const subject = subjectByCode.get(b.code)
    if (!subject) continue
    const asg = assignmentBySubjectId.get(subject.id)
    const maxima = deriveCtebMaxima(b.maxPeriode)
    branchRows.push({
      subjectId: subject.id,
      assignmentId: asg?.id ?? null,
      name: b.name,
      domainName: b.domainName,
      groupName: b.groupName,
      sortKey: `${String(sortIdx).padStart(4, "0")}|${b.name}`,
      maxPeriode: maxima.maxPeriode,
      maxExamen: maxima.maxExamen,
      maxSemestre: maxima.maxSemestre,
      maxAnnuel: maxima.maxAnnuel,
    })
    sortIdx++
  }

  for (const a of assignments) {
    if (branchRows.some((b) => b.subjectId === a.subjectId)) continue
    const maxima = deriveCtebMaxima(10)
    branchRows.push({
      subjectId: a.subjectId,
      assignmentId: a.id,
      name: a.subject.name,
      domainName: "Autres",
      groupName: null,
      sortKey: `9999|${a.subject.name}`,
      ...maxima,
    })
  }

  const assignmentIds = branchRows
    .map((b) => b.assignmentId)
    .filter((id): id is number => id != null)
  const enrollmentIds = allEnrollments.map((e) => e.id)

  const periodScore = new Map<string, number | null>()
  const examScore = new Map<string, number | null>()
  const repechageByKey = new Map<string, number>()

  if (assignmentIds.length > 0 && allPeriodIds.length > 0) {
    const columns = await prisma.evaluationColumn.findMany({
      where: {
        courseAssignmentId: { in: assignmentIds },
        periodId: { in: allPeriodIds },
      },
      include: {
        grades: {
          where: enrollmentIds.length
            ? { enrollmentId: { in: enrollmentIds } }
            : undefined,
        },
      },
    })

    const colsByAssignPeriod = new Map<string, typeof columns>()
    for (const col of columns) {
      const key = `${col.courseAssignmentId}:${col.periodId}`
      const list = colsByAssignPeriod.get(key) || []
      list.push(col)
      colsByAssignPeriod.set(key, list)
    }

    for (const branch of branchRows) {
      if (branch.assignmentId == null) continue
      for (const periodId of allPeriodIds) {
        const cols =
          colsByAssignPeriod.get(`${branch.assignmentId}:${periodId}`) || []
        const sumColumnMax = cols.reduce((s, c) => s + c.maxPoints, 0)
        for (const enr of allEnrollments) {
          const key = `${branch.assignmentId}:${enr.id}:${periodId}`
          if (!visibility.periods[String(periodId)]) {
            periodScore.set(key, null)
            continue
          }
          let sumObtained = 0
          let hasAny = false
          for (const col of cols) {
            const g = col.grades.find((x) => x.enrollmentId === enr.id)
            if (g) {
              sumObtained += g.pointsObtained
              hasAny = true
            }
          }
          if (!hasAny || branch.maxPeriode <= 0 || sumColumnMax <= 0) {
            periodScore.set(key, null)
          } else {
            const n = normalizePeriodResult({
              sumObtained,
              sumColumnMax,
              officialMax: branch.maxPeriode,
            })
            periodScore.set(
              key,
              n == null ? null : roundGrade(Math.min(n, branch.maxPeriode))
            )
          }
        }
      }
    }
  }

  if (assignmentIds.length > 0 && examGroupIds.length > 0) {
    const examGrades = await prisma.examGrade.findMany({
      where: {
        courseAssignmentId: { in: assignmentIds },
        periodGroupId: { in: examGroupIds },
        ...(enrollmentIds.length ? { enrollmentId: { in: enrollmentIds } } : {}),
      },
    })
    for (const g of examGrades) {
      if (!visibility.exams[String(g.periodGroupId)]) continue
      const branch = branchRows.find((b) => b.assignmentId === g.courseAssignmentId)
      const maxEx = branch?.maxExamen ?? g.pointsObtained
      examScore.set(
        `${g.courseAssignmentId}:${g.enrollmentId}:${g.periodGroupId}`,
        roundGrade(Math.min(g.pointsObtained, maxEx))
      )
    }
  }

  if (enrollmentIds.length > 0) {
    const repechages = await prisma.repechageGrade.findMany({
      where: {
        yearId,
        enrollmentId: { in: enrollmentIds },
        subjectId: { in: branchRows.map((b) => b.subjectId) },
      },
    })
    for (const r of repechages) {
      if (!visibility.year && !Object.values(visibility.trims).some(Boolean)) {
        continue
      }
      repechageByKey.set(
        `${r.enrollmentId}:${r.subjectId}`,
        roundGrade(Math.min(100, Math.max(0, r.percentage)), 1)
      )
    }
  }

  function buildLineForEnrollment(
    branch: BranchRow,
    enrollmentId: number
  ): SecondaryBulletinBranchLine {
    const periodScores = emptyScoreMap(periodKeyList)
    const examScores = emptyScoreMap(examKeyList)
    const semestreScores = emptyScoreMap(semestreKeyList)

    for (const pid of allPeriodIds) {
      if (!visibility.periods[String(pid)] || branch.assignmentId == null) {
        periodScores[String(pid)] = null
        continue
      }
      periodScores[String(pid)] =
        periodScore.get(`${branch.assignmentId}:${enrollmentId}:${pid}`) ?? null
    }
    for (const gid of examGroupIds) {
      if (!visibility.exams[String(gid)] || branch.assignmentId == null) {
        examScores[String(gid)] = null
        continue
      }
      examScores[String(gid)] =
        examScore.get(`${branch.assignmentId}:${enrollmentId}:${gid}`) ?? null
    }

    for (const t of semestres) {
      const gid = String(t.periodGroupId)
      if (!visibility.trims[gid]) {
        semestreScores[gid] = null
        continue
      }
      const parts: Array<number | null> = t.periods.map(
        (p) => periodScores[String(p.periodId)] ?? null
      )
      if (t.hasExam) parts.push(examScores[gid] ?? null)
      semestreScores[gid] = sumPeriodGroupTotal(parts)
    }

    const annualScore = visibility.year
      ? sumPeriodGroupTotal(
          semestres.map((t) => semestreScores[String(t.periodGroupId)])
        )
      : null

    const repechagePercent =
      visibility.year || Object.values(visibility.trims).some(Boolean)
        ? repechageByKey.get(`${enrollmentId}:${branch.subjectId}`) ?? null
        : null

    return {
      subjectId: branch.subjectId,
      assignmentId: branch.assignmentId,
      name: branch.name,
      domainName: branch.domainName,
      groupName: branch.groupName,
      maxPeriode: branch.maxPeriode,
      maxExamen: branch.maxExamen,
      maxSemestre: branch.maxSemestre,
      maxAnnuel: branch.maxAnnuel,
      periodScores,
      examScores,
      semestreScores,
      annualScore,
      repechagePercent,
    }
  }

  function buildDomainSubtotals(
    lines: SecondaryBulletinBranchLine[]
  ): SecondaryBulletinDomainSubtotal[] {
    const map = new Map<string, SecondaryBulletinDomainSubtotal>()
    for (const line of lines) {
      let cur = map.get(line.domainName)
      if (!cur) {
        cur = {
          domainName: line.domainName,
          maxPeriode: 0,
          maxExamen: 0,
          maxSemestre: 0,
          maxAnnuel: 0,
          periodScores: emptyScoreMap(periodKeyList),
          examScores: emptyScoreMap(examKeyList),
          semestreScores: emptyScoreMap(semestreKeyList),
          annualScore: null,
        }
        map.set(line.domainName, cur)
      }
      cur.maxPeriode += line.maxPeriode
      cur.maxExamen += line.maxExamen
      cur.maxSemestre += line.maxSemestre
      cur.maxAnnuel += line.maxAnnuel
      addScores(cur.periodScores, line.periodScores, periodKeyList)
      addScores(cur.examScores, line.examScores, examKeyList)
      addScores(cur.semestreScores, line.semestreScores, semestreKeyList)
      if (line.annualScore != null) {
        cur.annualScore = (cur.annualScore ?? 0) + line.annualScore
      }
    }
    return [...map.values()].map((d) => ({
      ...d,
      maxPeriode: roundGrade(d.maxPeriode),
      maxExamen: roundGrade(d.maxExamen),
      maxSemestre: roundGrade(d.maxSemestre),
      maxAnnuel: roundGrade(d.maxAnnuel),
      annualScore: d.annualScore == null ? null : roundGrade(d.annualScore),
      periodScores: Object.fromEntries(
        Object.entries(d.periodScores).map(([k, v]) => [
          k,
          v == null ? null : roundGrade(v),
        ])
      ),
      examScores: Object.fromEntries(
        Object.entries(d.examScores).map(([k, v]) => [
          k,
          v == null ? null : roundGrade(v),
        ])
      ),
      semestreScores: Object.fromEntries(
        Object.entries(d.semestreScores).map(([k, v]) => [
          k,
          v == null ? null : roundGrade(v),
        ])
      ),
    }))
  }

  const builtAll = allEnrollments.map((enr) => {
    const lines = branchRows.map((b) => buildLineForEnrollment(b, enr.id))
    const domainSubtotals = buildDomainSubtotals(lines)

    const maxPeriodTotal = roundGrade(
      lines.reduce((s, l) => s + l.maxPeriode, 0)
    )
    const maxExamTotal = roundGrade(lines.reduce((s, l) => s + l.maxExamen, 0))
    const maxSemTotal = roundGrade(lines.reduce((s, l) => s + l.maxSemestre, 0))
    const maxYearTotal = roundGrade(lines.reduce((s, l) => s + l.maxAnnuel, 0))

    const summaries: BulletinSummarySlice[] = []

    for (const t of semestres) {
      for (const p of t.periods) {
        const key = `period:${p.periodId}`
        const visible = !!visibility.periods[String(p.periodId)]
        let obtained: number | null = null
        if (visible) {
          let sum = 0
          let has = false
          for (const line of lines) {
            const v = line.periodScores[String(p.periodId)]
            if (v != null) {
              sum += v
              has = true
            }
          }
          obtained = has ? roundGrade(sum) : null
        }
        const percentage =
          obtained != null && maxPeriodTotal > 0
            ? roundGrade((obtained / maxPeriodTotal) * 100, 1)
            : null
        summaries.push({
          key,
          maxTotal: maxPeriodTotal,
          obtained,
          percentage,
          place: null,
          application: applicationFromPercentage(percentage),
        })
      }
      if (t.hasExam) {
        const key = `exam:${t.periodGroupId}`
        const visible = !!visibility.exams[String(t.periodGroupId)]
        let obtained: number | null = null
        if (visible) {
          let sum = 0
          let has = false
          for (const line of lines) {
            const v = line.examScores[String(t.periodGroupId)]
            if (v != null) {
              sum += v
              has = true
            }
          }
          obtained = has ? roundGrade(sum) : null
        }
        const percentage =
          obtained != null && maxExamTotal > 0
            ? roundGrade((obtained / maxExamTotal) * 100, 1)
            : null
        summaries.push({
          key,
          maxTotal: maxExamTotal,
          obtained,
          percentage,
          place: null,
          application: applicationFromPercentage(percentage),
        })
      }
      {
        const key = `trim:${t.periodGroupId}`
        const visible = !!visibility.trims[String(t.periodGroupId)]
        let obtained: number | null = null
        if (visible) {
          let sum = 0
          let has = false
          for (const line of lines) {
            const v = line.semestreScores[String(t.periodGroupId)]
            if (v != null) {
              sum += v
              has = true
            }
          }
          obtained = has ? roundGrade(sum) : null
        }
        const percentage =
          obtained != null && maxSemTotal > 0
            ? roundGrade((obtained / maxSemTotal) * 100, 1)
            : null
        summaries.push({
          key,
          maxTotal: maxSemTotal,
          obtained,
          percentage,
          place: null,
          application: applicationFromPercentage(percentage),
        })
      }
    }

    {
      let obtained: number | null = null
      if (visibility.year) {
        let sum = 0
        let has = false
        for (const line of lines) {
          if (line.annualScore != null) {
            sum += line.annualScore
            has = true
          }
        }
        obtained = has ? roundGrade(sum) : null
      }
      const percentage =
        obtained != null && maxYearTotal > 0
          ? roundGrade((obtained / maxYearTotal) * 100, 1)
          : null
      summaries.push({
        key: "year",
        maxTotal: maxYearTotal,
        obtained,
        percentage,
        place: null,
        application: applicationFromPercentage(percentage),
      })
    }

    const conduiteByPeriod: Record<string, ConduiteCode | null> = {}
    for (const pid of allPeriodIds) {
      conduiteByPeriod[String(pid)] = null
    }

    const repechageSubjects = lines
      .filter((l) => l.repechagePercent != null)
      .map((l) => ({
        subjectId: l.subjectId,
        name: l.name,
        percentage: l.repechagePercent as number,
      }))

    return {
      enrollmentId: enr.id,
      studentId: enr.student.id,
      code:
        toDisplayCode(enr.code) ||
        toDisplayCode(enr.student.permanentCode) ||
        "",
      permanentCode: enr.student.permanentCode,
      lastName: enr.student.lastName,
      middleName: enr.student.middleName,
      firstName: enr.student.firstName,
      fullName: displayName(enr.student),
      gender: enr.student.gender,
      birthDate: enr.student.birthDate
        ? enr.student.birthDate.toISOString().slice(0, 10)
        : null,
      birthPlace: enr.student.birthPlace,
      lines,
      domainSubtotals,
      summaries,
      conduiteByPeriod,
      repechageSubjects,
    }
  })

  const summaryKeys = builtAll[0]?.summaries.map((s) => s.key) || []
  for (const key of summaryKeys) {
    const places = assignPlaces(
      builtAll.map((stu) => ({
        enrollmentId: stu.enrollmentId,
        percentage: stu.summaries.find((s) => s.key === key)?.percentage ?? null,
      }))
    )
    for (const stu of builtAll) {
      const slice = stu.summaries.find((s) => s.key === key)
      if (slice) slice.place = places.get(stu.enrollmentId) ?? null
    }
  }

  const students = enrollmentFilter
    ? builtAll.filter((s) => s.enrollmentId === enrollmentFilter)
    : builtAll

  const titulaire = cls.titulaireTeacher
  const titulaireName = titulaire ? displayName(titulaire) || null : null

  return {
    school: {
      schoolName: school?.nomEtablissement ?? "",
      schoolAddress: school?.adresse ?? null,
      schoolCity: school?.ville ?? null,
      schoolPhone: school?.telephone ?? null,
      schoolEmail: school?.email ?? null,
      logoUrl: school?.logoUrl ?? null,
      sealUrl: school?.sealUrl ?? null,
      slogan: school?.slogan ?? null,
    },
    yearName: year.name,
    cycleKind: "SECONDARY",
    focusEvent: {
      kind,
      periodId: kind === "PERIOD" ? focusPeriodId : null,
      periodGroupId: kind === "EXAM" ? focusPeriodGroupId : null,
      label: focusLabel,
      groupName: focusGroupName,
    },
    class: {
      id: cls.id,
      name: cls.name,
      level: cls.level,
      letter: cls.letter,
      section: cls.section,
      titulaireName,
    },
    semestres,
    visibility,
    studentCount: allEnrollments.length,
    students,
  }
}
