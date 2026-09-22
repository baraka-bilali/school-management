import { prisma } from "@/lib/prisma"
import {
  CTEB_DEGREE_CATALOG,
  flattenCtebBranches,
  sumCtebMaxPeriode,
  type CtebDegreeCatalog,
} from "@/lib/grading/cteb-curriculum-catalog"
import { CTEB_SECTION, deriveCtebMaxima } from "@/lib/grading/cteb-maxima"
import { ensureDefaultEvaluationCycles } from "@/lib/grading/cycles"

async function getSecondaryCyclePeriods(schoolId: number) {
  const cycles = await ensureDefaultEvaluationCycles(schoolId)
  const secondary = cycles.find((c) => c.kind === "SECONDARY")
  if (!secondary) {
    return { periods: [] as Array<{ id: number }>, examGroups: [] as Array<{ id: number }> }
  }
  const periods = secondary.periodGroups.flatMap((g) =>
    g.periods.map((p) => ({ id: p.id }))
  )
  const examGroups = secondary.periodGroups
    .filter((g) => g.hasExam)
    .map((g) => ({ id: g.id }))
  return { periods, examGroups }
}

async function upsertSubjectMaxima(params: {
  schoolId: number
  subjectId: number
  levels: string[]
  maxPeriode: number
  periods: Array<{ id: number }>
  examGroups: Array<{ id: number }>
}) {
  const derived = deriveCtebMaxima(params.maxPeriode)

  for (const level of params.levels) {
    for (const period of params.periods) {
      await prisma.subjectPeriodMax.upsert({
        where: {
          subjectId_section_level_stream_periodId: {
            subjectId: params.subjectId,
            section: CTEB_SECTION,
            level,
            stream: "",
            periodId: period.id,
          },
        },
        create: {
          schoolId: params.schoolId,
          subjectId: params.subjectId,
          section: CTEB_SECTION,
          level,
          stream: "",
          periodId: period.id,
          maxPoints: derived.maxPeriode,
        },
        update: { maxPoints: derived.maxPeriode },
      })
    }

    for (const group of params.examGroups) {
      await prisma.subjectExamMax.upsert({
        where: {
          subjectId_section_level_stream_periodGroupId: {
            subjectId: params.subjectId,
            section: CTEB_SECTION,
            level,
            stream: "",
            periodGroupId: group.id,
          },
        },
        create: {
          schoolId: params.schoolId,
          subjectId: params.subjectId,
          section: CTEB_SECTION,
          level,
          stream: "",
          periodGroupId: group.id,
          maxPoints: derived.maxExamen,
        },
        update: { maxPoints: derived.maxExamen },
      })
    }
  }

  return derived
}

/**
 * Crée/met à jour les matières CTEB + maxima officiels (période & examen)
 * pour les niveaux 7ème et 8ème. N'assigne PAS d'enseignants :
 * chaque cours reste à lier via CourseAssignment (multi-enseignants par classe).
 */
export async function ensureCtebCurriculum(schoolId: number) {
  const { periods, examGroups } = await getSecondaryCyclePeriods(schoolId)
  if (periods.length === 0) {
    throw new Error("Cycle secondaire introuvable — initialisez les cycles d'évaluation")
  }

  const results: Array<{
    code: CtebDegreeCatalog["code"]
    name: string
    catalogMaxPeriodeTotal: number
    subjectCount: number
    derived: ReturnType<typeof deriveCtebMaxima>
  }> = []

  // Une seule passe matières (codes partagés 7e/8e) puis maxima par niveau
  const allLevels = ["7ème", "8ème"]
  const seenCodes = new Set<string>()
  const subjectIdsByCode = new Map<string, number>()

  for (const degree of CTEB_DEGREE_CATALOG) {
    const branches = flattenCtebBranches(degree)
    for (const b of branches) {
      if (seenCodes.has(b.code)) continue
      seenCodes.add(b.code)

      let subject = await prisma.subject.findFirst({
        where: { schoolId, code: b.code },
      })
      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            schoolId,
            name: b.name,
            code: b.code,
            color: "#0369a1",
            coefficient: 1,
            maxWeeklyHours: 4,
            groupLabel: b.groupName ?? b.domainName,
            isActive: true,
          },
        })
      } else {
        subject = await prisma.subject.update({
          where: { id: subject.id },
          data: {
            name: b.name,
            groupLabel: b.groupName ?? b.domainName,
            isActive: true,
          },
        })
      }
      subjectIdsByCode.set(b.code, subject.id)

      await upsertSubjectMaxima({
        schoolId,
        subjectId: subject.id,
        levels: allLevels,
        maxPeriode: b.maxPeriode,
        periods,
        examGroups,
      })
    }

    results.push({
      code: degree.code,
      name: degree.name,
      catalogMaxPeriodeTotal: sumCtebMaxPeriode(degree),
      subjectCount: flattenCtebBranches(degree).length,
      derived: deriveCtebMaxima(sumCtebMaxPeriode(degree)),
    })
  }

  return { results, subjectIdsByCode }
}

export async function listCtebCurriculum(_schoolId: number) {
  // Catalogue statique ; le seed des Subjects/maxima se fait via ensureCtebCurriculum
  return CTEB_DEGREE_CATALOG.map((degree) => {
    const branches = flattenCtebBranches(degree)
    const maxPeriodeTotal = sumCtebMaxPeriode(degree)
    return {
      code: degree.code,
      name: degree.name,
      levels: degree.levels,
      maxPeriodeTotal,
      maxima: deriveCtebMaxima(maxPeriodeTotal),
      domains: degree.domains.map((domain) => ({
        name: domain.name,
        groups: (domain.groups ?? []).map((g) => ({
          name: g.name,
          maxPeriodeSubtotal: g.branches.reduce((s, b) => s + b.maxPeriode, 0),
          branches: g.branches.map((b) => ({
            code: b.code,
            name: b.name,
            maxPeriode: b.maxPeriode,
            maxima: deriveCtebMaxima(b.maxPeriode),
          })),
        })),
        branches: (domain.branches ?? []).map((b) => ({
          code: b.code,
          name: b.name,
          maxPeriode: b.maxPeriode,
          maxima: deriveCtebMaxima(b.maxPeriode),
        })),
        maxPeriodeSubtotal:
          (domain.groups ?? []).reduce(
            (s, g) => s + g.branches.reduce((ss, b) => ss + b.maxPeriode, 0),
            0
          ) + (domain.branches ?? []).reduce((s, b) => s + b.maxPeriode, 0),
      })),
      branchCount: branches.length,
    }
  })
}
