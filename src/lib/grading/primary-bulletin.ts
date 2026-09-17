import { prisma } from "@/lib/prisma"
import { normalizePeriodResult, roundGrade, sumPeriodGroupTotal } from "@/lib/grading/normalize"
import {
  derivePrimaryMaxima,
  primaryDegreeCodeForLevel,
} from "@/lib/grading/primary-maxima"
import { ensureDefaultEvaluationCycles } from "@/lib/grading/cycles"
import { bulletinEventKey } from "@/lib/grading/class-submission-status"
import { PRIMARY_PERIOD_COLUMN_LABEL } from "@/lib/grading/primary-cotation"
import { toDisplayCode } from "@/lib/student-fields"

export type BulletinSchoolInfo = {
  schoolName: string
  schoolAddress: string | null
  schoolCity: string | null
  schoolPhone: string | null
  schoolEmail: string | null
  logoUrl: string | null
  sealUrl: string | null
  slogan: string | null
}

export type BulletinPeriodCol = {
  periodId: number
  name: string
  shortLabel: string
  sortOrder: number
}

export type BulletinTrimestreCol = {
  periodGroupId: number
  name: string
  shortLabel: string
  sortOrder: number
  hasExam: boolean
  periods: BulletinPeriodCol[]
}

/** Visibilité cumulative basée sur BulletinPublication. */
export type BulletinVisibility = {
  /** periodId → visible pour les points */
  periods: Record<string, boolean>
  /** periodGroupId → examen visible */
  exams: Record<string, boolean>
  /** periodGroupId → total trimestre visible */
  trims: Record<string, boolean>
  year: boolean
  /** Dernier événement publié (pour debug / UI) */
  publishedThroughLabel: string | null
}

export type BulletinBranchLine = {
  subjectId: number
  name: string
  domainName: string
  groupName: string | null
  maxPeriode: number
  maxExamen: number
  maxTrimestre: number
  maxAnnuel: number
  /** null = non publié ou non saisi (maxima restent affichés côté PDF) */
  periodScores: Record<string, number | null>
  examScores: Record<string, number | null>
  trimScores: Record<string, number | null>
  annualScore: number | null
}

export type BulletinDomainSubtotal = {
  domainName: string
  maxPeriode: number
  maxExamen: number
  maxTrimestre: number
  maxAnnuel: number
  periodScores: Record<string, number | null>
  examScores: Record<string, number | null>
  trimScores: Record<string, number | null>
  annualScore: number | null
}

export type BulletinSummarySlice = {
  key: string
  maxTotal: number
  obtained: number | null
  percentage: number | null
  place: number | null
  /** Application dérivée du % (null si colonne non publiée) */
  application: string | null
}

export const CONDUITE_CODES = ["E", "TB", "B", "A", "M", "MA"] as const
export type ConduiteCode = (typeof CONDUITE_CODES)[number]

export type BulletinStudentPayload = {
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
  lines: BulletinBranchLine[]
  domainSubtotals: BulletinDomainSubtotal[]
  summaries: BulletinSummarySlice[]
  /** Conduite par periodId uniquement (jamais exam/trim/année) */
  conduiteByPeriod: Record<string, ConduiteCode | null>
}

export type PrimaryBulletinPayload = {
  school: BulletinSchoolInfo
  yearName: string
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
    titulaireName: string | null
  }
  trimestres: BulletinTrimestreCol[]
  visibility: BulletinVisibility
  studentCount: number
  students: BulletinStudentPayload[]
}

/** Barème Application à partir du pourcentage. */
export function applicationFromPercentage(pct: number | null): string | null {
  if (pct == null || !Number.isFinite(pct)) return null
  if (pct >= 90) return "Élite"
  if (pct >= 80) return "TB"
  if (pct >= 70) return "B"
  if (pct >= 60) return "AB"
  if (pct >= 50) return "S"
  if (pct >= 40) return "Med"
  return "Mauv"
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

function titulaireName(t: {
  lastName: string
  middleName: string
  firstName: string
} | null): string | null {
  if (!t) return null
  return displayName(t) || null
}

function shortPeriodLabel(name: string, indexInGroup: number): string {
  const m = name.match(/(\d+)/)
  if (m) return `${m[1]}P`
  return `P${indexInGroup + 1}`
}

function shortTrimLabel(name: string, sortOrder: number): string {
  const m = name.match(/(\d+)/)
  if (m) return `T${m[1]}`
  return `T${sortOrder}`
}

function sumNullable(parts: Array<number | null | undefined>): number | null {
  return sumPeriodGroupTotal(parts)
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

type ChronoSlot =
  | { kind: "period"; periodId: number; pubKey: string; label: string }
  | { kind: "exam"; periodGroupId: number; pubKey: string; label: string }
  | { kind: "trim"; periodGroupId: number; label: string }
  | { kind: "year"; label: string }

function buildChronoSlots(trimestres: BulletinTrimestreCol[]): ChronoSlot[] {
  const slots: ChronoSlot[] = []
  for (const t of trimestres) {
    for (const p of t.periods) {
      slots.push({
        kind: "period",
        periodId: p.periodId,
        pubKey: bulletinEventKey("PERIOD", p.periodId, null),
        label: `${t.shortLabel} ${p.shortLabel}`,
      })
    }
    if (t.hasExam) {
      slots.push({
        kind: "exam",
        periodGroupId: t.periodGroupId,
        pubKey: bulletinEventKey("EXAM", null, t.periodGroupId),
        label: `Examen ${t.shortLabel}`,
      })
      slots.push({
        kind: "trim",
        periodGroupId: t.periodGroupId,
        label: `Total ${t.shortLabel}`,
      })
    }
  }
  slots.push({ kind: "year", label: "Total annuel" })
  return slots
}

/**
 * Publication cumulative : le plus loin événement PERIOD/EXAM publié
 * rend visibles toutes les colonnes jusqu'à lui (et le total trim si examen).
 */
export function computeBulletinVisibility(
  trimestres: BulletinTrimestreCol[],
  publishedEventKeys: Set<string>
): BulletinVisibility {
  const slots = buildChronoSlots(trimestres)
  let reach = -1
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    if (
      (s.kind === "period" || s.kind === "exam") &&
      publishedEventKeys.has(s.pubKey)
    ) {
      reach = i
      if (s.kind === "exam" && slots[i + 1]?.kind === "trim") {
        reach = i + 1
      }
    }
  }
  // Année visible seulement si le dernier total trimestre est atteint
  if (reach >= 0 && slots[reach]?.kind === "trim") {
    const laterTrim = slots.slice(reach + 1).some((x) => x.kind === "trim")
    if (!laterTrim && slots[reach + 1]?.kind === "year") {
      reach = reach + 1
    }
  }

  const periods: Record<string, boolean> = {}
  const exams: Record<string, boolean> = {}
  const trims: Record<string, boolean> = {}
  let year = false
  let publishedThroughLabel: string | null = null

  for (let i = 0; i <= reach; i++) {
    const s = slots[i]
    publishedThroughLabel = s.label
    if (s.kind === "period") periods[String(s.periodId)] = true
    if (s.kind === "exam") exams[String(s.periodGroupId)] = true
    if (s.kind === "trim") trims[String(s.periodGroupId)] = true
    if (s.kind === "year") year = true
  }

  for (const t of trimestres) {
    for (const p of t.periods) {
      if (periods[String(p.periodId)] == null) periods[String(p.periodId)] = false
    }
    if (t.hasExam) {
      if (exams[String(t.periodGroupId)] == null)
        exams[String(t.periodGroupId)] = false
      if (trims[String(t.periodGroupId)] == null)
        trims[String(t.periodGroupId)] = false
    }
  }

  return { periods, exams, trims, year, publishedThroughLabel }
}

/**
 * Clés « comme publiées » jusqu'à l'événement focus (aperçu staff sans publier).
 */
export function staffRevealEventKeys(
  trimestres: BulletinTrimestreCol[],
  focusKind: "PERIOD" | "EXAM",
  focusPeriodId: number | null,
  focusPeriodGroupId: number | null
): Set<string> {
  const focusKey = bulletinEventKey(focusKind, focusPeriodId, focusPeriodGroupId)
  const keys = new Set<string>()
  let found = false
  for (const s of buildChronoSlots(trimestres)) {
    if (s.kind !== "period" && s.kind !== "exam") continue
    keys.add(s.pubKey)
    if (s.pubKey === focusKey) {
      found = true
      break
    }
  }
  return found ? keys : new Set([focusKey])
}

/**
 * Charge les bulletins primaire.
 * - audience "student" (défaut) : notes seulement si BulletinPublication
 * - audience "staff" : notes jusqu'à l'événement focus (aperçu admin/enseignant, sans publier)
 */
export async function loadPrimaryBulletins(params: {
  schoolId: number
  yearId: number
  classId: number
  kind: "PERIOD" | "EXAM"
  periodId?: number | null
  periodGroupId?: number | null
  enrollmentId?: number | null
  /** student = gate publications ; staff = aperçu jusqu'au focus */
  audience?: "student" | "staff"
}): Promise<PrimaryBulletinPayload> {
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
      where: { id: classId, schoolId, section: "Primaire" },
      include: {
        titulaireTeacher: {
          select: { lastName: true, middleName: true, firstName: true },
        },
      },
    }),
    ensureDefaultEvaluationCycles(schoolId),
    audience === "student"
      ? prisma.bulletinPublication.findMany({
          where: { schoolId, classId, yearId },
          select: { eventKey: true },
        })
      : Promise.resolve([] as { eventKey: string }[]),
  ])

  if (!cls) throw new Error("Classe introuvable")
  if (!year) throw new Error("Année scolaire introuvable")

  const primaryCycle = cycles.find((c) => c.kind === "PRIMARY")
  if (!primaryCycle) throw new Error("Cycle primaire introuvable")

  const trimestres: BulletinTrimestreCol[] = primaryCycle.periodGroups
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => {
      const periods = g.periods
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
        shortLabel: shortTrimLabel(g.name, g.sortOrder),
        sortOrder: g.sortOrder,
        hasExam: g.hasExam,
        periods,
      }
    })

  const publishedKeys =
    audience === "staff"
      ? staffRevealEventKeys(trimestres, kind, focusPeriodId, focusPeriodGroupId)
      : new Set(publications.map((p) => p.eventKey))
  const visibility = computeBulletinVisibility(trimestres, publishedKeys)

  let focusLabel = ""
  let focusGroupName = ""
  if (kind === "PERIOD" && focusPeriodId) {
    for (const t of trimestres) {
      const p = t.periods.find((x) => x.periodId === focusPeriodId)
      if (p) {
        focusLabel = p.name
        focusGroupName = t.name
        break
      }
    }
  } else if (kind === "EXAM" && focusPeriodGroupId) {
    const t = trimestres.find((x) => x.periodGroupId === focusPeriodGroupId)
    if (t) {
      focusLabel = `Examen — ${t.name}`
      focusGroupName = t.name
    }
  }
  if (!focusLabel) {
    const first = trimestres[0]?.periods[0]
    focusLabel = first?.name || "Bulletin"
    focusGroupName = trimestres[0]?.name || ""
  }

  const degreeCode = primaryDegreeCodeForLevel(cls.level)
  const allPeriodIds = trimestres.flatMap((t) => t.periods.map((p) => p.periodId))
  const examGroupIds = trimestres
    .filter((t) => t.hasExam)
    .map((t) => t.periodGroupId)
  const periodKeyList = allPeriodIds.map(String)
  const examKeyList = examGroupIds.map(String)
  const trimKeyList = trimestres.map((t) => String(t.periodGroupId))

  const [allEnrollments, assignments, curriculumBranches] = await Promise.all([
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
      include: { subject: { select: { id: true, name: true } } },
    }),
    degreeCode
      ? prisma.primaryBranch.findMany({
          where: {
            isActive: true,
            subjectId: { not: null },
            domain: {
              degree: { schoolId, code: degreeCode, isActive: true },
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

  const branchMetaBySubject = new Map<
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
    if (!b.subjectId || branchMetaBySubject.has(b.subjectId)) continue
    const maxima = derivePrimaryMaxima(b.maxPeriode, {
      maxExamenOverride: b.maxExamenOverride,
      maxTrimestreOverride: b.maxTrimestreOverride,
      maxAnnuelOverride: b.maxAnnuelOverride,
    })
    branchMetaBySubject.set(b.subjectId, {
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

  type BranchRow = {
    subjectId: number
    assignmentId: number
    name: string
    domainName: string
    groupName: string | null
    sortKey: string
    maxPeriode: number
    maxExamen: number
    maxTrimestre: number
    maxAnnuel: number
  }

  const branchRows: BranchRow[] = assignments.map((a) => {
    const meta = branchMetaBySubject.get(a.subjectId)
    if (meta) {
      return {
        subjectId: a.subjectId,
        assignmentId: a.id,
        name: meta.name,
        domainName: meta.domainName,
        groupName: meta.groupName,
        sortKey: meta.sortKey,
        maxPeriode: meta.maxPeriode,
        maxExamen: meta.maxExamen,
        maxTrimestre: meta.maxTrimestre,
        maxAnnuel: meta.maxAnnuel,
      }
    }
    const fallback = derivePrimaryMaxima(10)
    return {
      subjectId: a.subjectId,
      assignmentId: a.id,
      name: a.subject.name,
      domainName: "Autres",
      groupName: null,
      sortKey: `9999|9999|9999|${a.subject.name}`,
      ...fallback,
    }
  })
  branchRows.sort((a, b) => a.sortKey.localeCompare(b.sortKey, "fr"))

  const assignmentIds = branchRows.map((b) => b.assignmentId)
  const enrollmentIds = allEnrollments.map((e) => e.id)

  const periodScore = new Map<string, number | null>()
  const examScore = new Map<string, number | null>()

  if (assignmentIds.length > 0 && allPeriodIds.length > 0) {
    // Primaire : uniquement la colonne officielle « Cotation période »
    // (ignorer Interrogation / autres colonnes legacy qui faussent le bulletin).
    const columns = await prisma.evaluationColumn.findMany({
      where: {
        courseAssignmentId: { in: assignmentIds },
        periodId: { in: allPeriodIds },
        label: PRIMARY_PERIOD_COLUMN_LABEL,
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
      for (const periodId of allPeriodIds) {
        const cols =
          colsByAssignPeriod.get(`${branch.assignmentId}:${periodId}`) || []
        const sumColumnMax = cols.reduce((s, c) => s + c.maxPoints, 0)
        for (const enr of allEnrollments) {
          const key = `${branch.assignmentId}:${enr.id}:${periodId}`
          // Gate publication à la source
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
            periodScore.set(key, n == null ? null : roundGrade(n))
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
      examScore.set(
        `${g.courseAssignmentId}:${g.enrollmentId}:${g.periodGroupId}`,
        roundGrade(g.pointsObtained)
      )
    }
  }

  function buildLineForEnrollment(
    branch: BranchRow,
    enrollmentId: number
  ): BulletinBranchLine {
    const periodScores = emptyScoreMap(periodKeyList)
    const examScores = emptyScoreMap(examKeyList)
    const trimScores = emptyScoreMap(trimKeyList)

    for (const pid of allPeriodIds) {
      if (!visibility.periods[String(pid)]) {
        periodScores[String(pid)] = null
        continue
      }
      periodScores[String(pid)] =
        periodScore.get(`${branch.assignmentId}:${enrollmentId}:${pid}`) ?? null
    }
    for (const gid of examGroupIds) {
      if (!visibility.exams[String(gid)]) {
        examScores[String(gid)] = null
        continue
      }
      examScores[String(gid)] =
        examScore.get(`${branch.assignmentId}:${enrollmentId}:${gid}`) ?? null
    }

    for (const t of trimestres) {
      const gid = String(t.periodGroupId)
      if (!visibility.trims[gid]) {
        trimScores[gid] = null
        continue
      }
      const parts: Array<number | null> = t.periods.map(
        (p) => periodScores[String(p.periodId)] ?? null
      )
      if (t.hasExam) parts.push(examScores[gid] ?? null)
      trimScores[gid] = sumNullable(parts)
    }

    const annualScore = visibility.year
      ? sumNullable(trimestres.map((t) => trimScores[String(t.periodGroupId)]))
      : null

    return {
      subjectId: branch.subjectId,
      name: branch.name,
      domainName: branch.domainName,
      groupName: branch.groupName,
      maxPeriode: branch.maxPeriode,
      maxExamen: branch.maxExamen,
      maxTrimestre: branch.maxTrimestre,
      maxAnnuel: branch.maxAnnuel,
      periodScores,
      examScores,
      trimScores,
      annualScore,
    }
  }

  function buildDomainSubtotals(
    lines: BulletinBranchLine[]
  ): BulletinDomainSubtotal[] {
    const map = new Map<string, BulletinDomainSubtotal>()
    for (const line of lines) {
      let cur = map.get(line.domainName)
      if (!cur) {
        cur = {
          domainName: line.domainName,
          maxPeriode: 0,
          maxExamen: 0,
          maxTrimestre: 0,
          maxAnnuel: 0,
          periodScores: emptyScoreMap(periodKeyList),
          examScores: emptyScoreMap(examKeyList),
          trimScores: emptyScoreMap(trimKeyList),
          annualScore: null,
        }
        map.set(line.domainName, cur)
      }
      cur.maxPeriode += line.maxPeriode
      cur.maxExamen += line.maxExamen
      cur.maxTrimestre += line.maxTrimestre
      cur.maxAnnuel += line.maxAnnuel
      addScores(cur.periodScores, line.periodScores, periodKeyList)
      addScores(cur.examScores, line.examScores, examKeyList)
      addScores(cur.trimScores, line.trimScores, trimKeyList)
      if (line.annualScore != null) {
        cur.annualScore = (cur.annualScore ?? 0) + line.annualScore
      }
    }
    return [...map.values()].map((d) => ({
      ...d,
      maxPeriode: roundGrade(d.maxPeriode),
      maxExamen: roundGrade(d.maxExamen),
      maxTrimestre: roundGrade(d.maxTrimestre),
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
      trimScores: Object.fromEntries(
        Object.entries(d.trimScores).map(([k, v]) => [
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
    const maxTrimTotal = roundGrade(
      lines.reduce((s, l) => s + l.maxTrimestre, 0)
    )
    const maxYearTotal = roundGrade(lines.reduce((s, l) => s + l.maxAnnuel, 0))

    const summaries: BulletinSummarySlice[] = []

    for (const t of trimestres) {
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
            const v = line.trimScores[String(t.periodGroupId)]
            if (v != null) {
              sum += v
              has = true
            }
          }
          obtained = has ? roundGrade(sum) : null
        }
        const percentage =
          obtained != null && maxTrimTotal > 0
            ? roundGrade((obtained / maxTrimTotal) * 100, 1)
            : null
        summaries.push({
          key,
          maxTotal: maxTrimTotal,
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
      // Pas encore de saisie persistée — cases vides ; non publiées = null
      conduiteByPeriod[String(pid)] = visibility.periods[String(pid)]
        ? null
        : null
    }

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
      titulaireName: titulaireName(cls.titulaireTeacher),
    },
    trimestres,
    visibility,
    studentCount: allEnrollments.length,
    students,
  }
}

export type ClassStudentOption = {
  enrollmentId: number
  studentId: number
  code: string
  lastName: string
  middleName: string
  firstName: string
  fullName: string
}

export async function loadClassStudentsAlpha(params: {
  schoolId: number
  yearId: number
  classId: number
}): Promise<ClassStudentOption[]> {
  const cls = await prisma.class.findFirst({
    where: {
      id: params.classId,
      schoolId: params.schoolId,
      section: "Primaire",
    },
    select: { id: true },
  })
  if (!cls) throw new Error("Classe introuvable")

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: params.classId,
      yearId: params.yearId,
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
    orderBy: [
      { student: { lastName: "asc" } },
      { student: { middleName: "asc" } },
      { student: { firstName: "asc" } },
    ],
  })

  return enrollments.map((enr) => ({
    enrollmentId: enr.id,
    studentId: enr.student.id,
    code:
      toDisplayCode(enr.code) || toDisplayCode(enr.student.permanentCode) || "",
    lastName: enr.student.lastName,
    middleName: enr.student.middleName,
    firstName: enr.student.firstName,
    fullName: displayName(enr.student),
  }))
}
