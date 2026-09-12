import { prisma } from "@/lib/prisma"
import {
  PRIMARY_DEGREE_CATALOG,
  type PrimaryBranchCatalog,
  type PrimaryDegreeCatalog,
  sumDegreeMaxPeriode,
} from "@/lib/grading/primary-curriculum-catalog"
import {
  derivePrimaryMaxima,
  primaryDegreeCodeForLevel,
} from "@/lib/grading/primary-maxima"
import { DEFAULT_EVALUATION_CYCLES } from "@/lib/grading/default-cycles"

const PRIMARY_SECTION = "Primaire"

const DEGREE_CODE_PREFIX: Record<PrimaryDegreeCatalog["code"], string> = {
  ELEMENTAIRE: "EL",
  MOYEN: "MO",
  TERMINAL_5: "T5",
  TERMINAL_6: "T6",
}

function slugCode(input: string, maxLen = 18): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, maxLen)
  return base || "BR"
}

function branchSubjectCode(
  degreeCode: PrimaryDegreeCatalog["code"],
  branchName: string,
  sortOrder: number
): string {
  const prefix = DEGREE_CODE_PREFIX[degreeCode]
  const slug = slugCode(branchName, 12)
  return `P${prefix}-${slug}-${sortOrder}`.slice(0, 32)
}

function branchSubjectName(branch: PrimaryBranchCatalog, degreeName: string): string {
  return `${branch.name} · ${degreeName}`
}

async function ensurePrimaryCycleExists(schoolId: number) {
  const existing = await prisma.evaluationCycle.findUnique({
    where: { schoolId_kind: { schoolId, kind: "PRIMARY" } },
    include: {
      periodGroups: {
        orderBy: { sortOrder: "asc" },
        include: { periods: { orderBy: { sortOrder: "asc" } } },
      },
    },
  })
  if (existing) return existing

  const def = DEFAULT_EVALUATION_CYCLES.find((d) => d.kind === "PRIMARY")
  if (!def) return null

  return prisma.evaluationCycle.create({
    data: {
      schoolId,
      name: def.name,
      kind: def.kind,
      sections: { create: def.sections.map((section) => ({ section })) },
      periodGroups: {
        create: def.periodGroups.map((g) => ({
          name: g.name,
          sortOrder: g.sortOrder,
          hasExam: g.hasExam,
          periods: {
            create: g.periods.map((p) => ({
              name: p.name,
              sortOrder: p.sortOrder,
            })),
          },
        })),
      },
    },
    include: {
      periodGroups: {
        orderBy: { sortOrder: "asc" },
        include: { periods: { orderBy: { sortOrder: "asc" } } },
      },
    },
  })
}

async function getPrimaryCyclePeriods(schoolId: number) {
  const cycle = await ensurePrimaryCycleExists(schoolId)
  if (!cycle) {
    return { periods: [] as Array<{ id: number }>, examGroups: [] as Array<{ id: number }> }
  }
  const periods = cycle.periodGroups.flatMap((g) => g.periods.map((p) => ({ id: p.id })))
  const examGroups = cycle.periodGroups.filter((g) => g.hasExam).map((g) => ({ id: g.id }))
  return { periods, examGroups }
}

async function upsertBranchMaxima(params: {
  schoolId: number
  subjectId: number
  levels: string[]
  maxPeriode: number
  maxExamenOverride?: number | null
  maxTrimestreOverride?: number | null
  maxAnnuelOverride?: number | null
  periods: Array<{ id: number }>
  examGroups: Array<{ id: number }>
}) {
  const derived = derivePrimaryMaxima(params.maxPeriode, {
    maxExamenOverride: params.maxExamenOverride,
    maxTrimestreOverride: params.maxTrimestreOverride,
    maxAnnuelOverride: params.maxAnnuelOverride,
  })

  for (const level of params.levels) {
    for (const period of params.periods) {
      await prisma.subjectPeriodMax.upsert({
        where: {
          subjectId_section_level_stream_periodId: {
            subjectId: params.subjectId,
            section: PRIMARY_SECTION,
            level,
            stream: "",
            periodId: period.id,
          },
        },
        create: {
          schoolId: params.schoolId,
          subjectId: params.subjectId,
          section: PRIMARY_SECTION,
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
            section: PRIMARY_SECTION,
            level,
            stream: "",
            periodGroupId: group.id,
          },
        },
        create: {
          schoolId: params.schoolId,
          subjectId: params.subjectId,
          section: PRIMARY_SECTION,
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

async function upsertBranch(params: {
  schoolId: number
  degreeCode: PrimaryDegreeCatalog["code"]
  degreeName: string
  levels: string[]
  domainId: number
  groupId: number | null
  branchSeed: PrimaryBranchCatalog
  sortOrder: number
  periods: Array<{ id: number }>
  examGroups: Array<{ id: number }>
  groupLabel?: string | null
}) {
  const subjectName = branchSubjectName(params.branchSeed, params.degreeName)
  const desiredCode = branchSubjectCode(params.degreeCode, params.branchSeed.name, params.sortOrder)

  let existingBranch = await prisma.primaryBranch.findFirst({
    where: {
      domainId: params.domainId,
      groupId: params.groupId,
      name: params.branchSeed.name,
    },
    include: { subject: true },
  })

  let subject =
    existingBranch?.subjectId != null
      ? await prisma.subject.findFirst({
          where: { id: existingBranch.subjectId, schoolId: params.schoolId },
        })
      : null

  if (!subject) {
    subject = await prisma.subject.findFirst({
      where: { schoolId: params.schoolId, code: desiredCode },
    })
  }

  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        schoolId: params.schoolId,
        name: subjectName,
        code: desiredCode,
        color: "#0f766e",
        coefficient: 1,
        maxWeeklyHours: 2,
        groupLabel: params.groupLabel ?? null,
      },
    })
  } else {
    subject = await prisma.subject.update({
      where: { id: subject.id },
      data: {
        name: subjectName,
        groupLabel: params.groupLabel ?? subject.groupLabel,
        isActive: true,
      },
    })
  }

  if (!existingBranch) {
    existingBranch = await prisma.primaryBranch.create({
      data: {
        domainId: params.domainId,
        groupId: params.groupId,
        name: params.branchSeed.name,
        maxPeriode: params.branchSeed.maxPeriode,
        sortOrder: params.sortOrder,
        subjectId: subject.id,
        isActive: true,
      },
      include: { subject: true },
    })
  } else {
    // Preserve admin-edited maxPeriode / overrides
    existingBranch = await prisma.primaryBranch.update({
      where: { id: existingBranch.id },
      data: {
        sortOrder: params.sortOrder,
        subjectId: subject.id,
        isActive: true,
      },
      include: { subject: true },
    })
  }

  await upsertBranchMaxima({
    schoolId: params.schoolId,
    subjectId: subject.id,
    levels: params.levels,
    maxPeriode: existingBranch.maxPeriode,
    maxExamenOverride: existingBranch.maxExamenOverride,
    maxTrimestreOverride: existingBranch.maxTrimestreOverride,
    maxAnnuelOverride: existingBranch.maxAnnuelOverride,
    periods: params.periods,
    examGroups: params.examGroups,
  })

  return existingBranch
}

async function syncDomainTree(params: {
  schoolId: number
  degreeId: number
  degreeCode: PrimaryDegreeCatalog["code"]
  degreeName: string
  levels: string[]
  domains: PrimaryDegreeCatalog["domains"]
  periods: Array<{ id: number }>
  examGroups: Array<{ id: number }>
}) {
  for (const [dIdx, domainSeed] of params.domains.entries()) {
    let domain = await prisma.primaryDomain.findFirst({
      where: { degreeId: params.degreeId, name: domainSeed.name },
    })
    if (!domain) {
      domain = await prisma.primaryDomain.create({
        data: { degreeId: params.degreeId, name: domainSeed.name, sortOrder: dIdx },
      })
    } else if (domain.sortOrder !== dIdx) {
      domain = await prisma.primaryDomain.update({
        where: { id: domain.id },
        data: { sortOrder: dIdx },
      })
    }

    for (const [bIdx, branchSeed] of (domainSeed.branches ?? []).entries()) {
      await upsertBranch({
        schoolId: params.schoolId,
        degreeCode: params.degreeCode,
        degreeName: params.degreeName,
        levels: params.levels,
        domainId: domain.id,
        groupId: null,
        branchSeed,
        sortOrder: bIdx,
        periods: params.periods,
        examGroups: params.examGroups,
        groupLabel: null,
      })
    }

    for (const [gIdx, groupSeed] of (domainSeed.groups ?? []).entries()) {
      let group = await prisma.primaryGroup.findFirst({
        where: { domainId: domain.id, name: groupSeed.name },
      })
      if (!group) {
        group = await prisma.primaryGroup.create({
          data: { domainId: domain.id, name: groupSeed.name, sortOrder: gIdx },
        })
      } else if (group.sortOrder !== gIdx) {
        group = await prisma.primaryGroup.update({
          where: { id: group.id },
          data: { sortOrder: gIdx },
        })
      }

      for (const [bIdx, branchSeed] of groupSeed.branches.entries()) {
        await upsertBranch({
          schoolId: params.schoolId,
          degreeCode: params.degreeCode,
          degreeName: params.degreeName,
          levels: params.levels,
          domainId: domain.id,
          groupId: group.id,
          branchSeed,
          sortOrder: bIdx,
          periods: params.periods,
          examGroups: params.examGroups,
          groupLabel: groupSeed.name,
        })
      }
    }
  }
}

/** Seed / sync the 4 official primary degree structures for a school. */
export async function ensurePrimaryCurriculum(schoolId: number) {
  const { periods, examGroups } = await getPrimaryCyclePeriods(schoolId)

  const results: Array<{
    code: PrimaryDegreeCatalog["code"]
    name: string
    needsReview: boolean
    catalogMaxPeriodeTotal: number
    dbMaxPeriodeTotal: number
    derived: ReturnType<typeof derivePrimaryMaxima>
  }> = []

  for (const [sortOrder, seed] of PRIMARY_DEGREE_CATALOG.entries()) {
    let degree = await prisma.primaryDegree.findUnique({
      where: { schoolId_code: { schoolId, code: seed.code } },
    })

    if (!degree) {
      degree = await prisma.primaryDegree.create({
        data: {
          schoolId,
          code: seed.code,
          name: seed.name,
          levelsJson: JSON.stringify(seed.levels),
          needsReview: seed.needsReview,
          sortOrder,
        },
      })
    } else {
      degree = await prisma.primaryDegree.update({
        where: { id: degree.id },
        data: {
          name: seed.name,
          levelsJson: JSON.stringify(seed.levels),
          sortOrder,
          needsReview: degree.needsReview || seed.needsReview,
        },
      })
    }

    await syncDomainTree({
      schoolId,
      degreeId: degree.id,
      degreeCode: seed.code,
      degreeName: seed.name,
      levels: seed.levels,
      domains: seed.domains,
      periods,
      examGroups,
    })

    const branches = await prisma.primaryBranch.findMany({
      where: { domain: { degreeId: degree.id }, isActive: true },
      select: { maxPeriode: true },
    })
    const dbMaxPeriodeTotal = branches.reduce((s, b) => s + b.maxPeriode, 0)

    results.push({
      code: seed.code,
      name: seed.name,
      needsReview: degree.needsReview,
      catalogMaxPeriodeTotal: sumDegreeMaxPeriode(seed),
      dbMaxPeriodeTotal,
      derived: derivePrimaryMaxima(dbMaxPeriodeTotal),
    })
  }

  return results
}

export async function listPrimaryCurriculum(schoolId: number) {
  const degrees = await prisma.primaryDegree.findMany({
    where: { schoolId, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      domains: {
        orderBy: { sortOrder: "asc" },
        include: {
          groups: {
            orderBy: { sortOrder: "asc" },
            include: {
              branches: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
                include: { subject: { select: { id: true, name: true, code: true } } },
              },
            },
          },
          branches: {
            where: { isActive: true, groupId: null },
            orderBy: { sortOrder: "asc" },
            include: { subject: { select: { id: true, name: true, code: true } } },
          },
        },
      },
    },
  })

  return degrees.map((degree) => {
    const levels = (() => {
      try {
        const parsed = JSON.parse(degree.levelsJson)
        return Array.isArray(parsed) ? (parsed as string[]) : []
      } catch {
        return []
      }
    })()

    let maxPeriodeTotal = 0
    const domains = degree.domains.map((domain) => {
      const groups = domain.groups.map((group) => {
        const groupTotal = group.branches.reduce((s, b) => s + b.maxPeriode, 0)
        maxPeriodeTotal += groupTotal
        return {
          id: group.id,
          name: group.name,
          sortOrder: group.sortOrder,
          maxPeriodeSubtotal: groupTotal,
          branches: group.branches.map((b) => ({
            id: b.id,
            name: b.name,
            maxPeriode: b.maxPeriode,
            maxima: derivePrimaryMaxima(b.maxPeriode, {
              maxExamenOverride: b.maxExamenOverride,
              maxTrimestreOverride: b.maxTrimestreOverride,
              maxAnnuelOverride: b.maxAnnuelOverride,
            }),
            sortOrder: b.sortOrder,
            subjectId: b.subjectId,
            subject: b.subject,
          })),
        }
      })

      const directBranches = domain.branches.map((b) => {
        maxPeriodeTotal += b.maxPeriode
        return {
          id: b.id,
          name: b.name,
          maxPeriode: b.maxPeriode,
          maxima: derivePrimaryMaxima(b.maxPeriode, {
            maxExamenOverride: b.maxExamenOverride,
            maxTrimestreOverride: b.maxTrimestreOverride,
            maxAnnuelOverride: b.maxAnnuelOverride,
          }),
          sortOrder: b.sortOrder,
          subjectId: b.subjectId,
          subject: b.subject,
        }
      })

      const domainTotal =
        groups.reduce((s, g) => s + g.maxPeriodeSubtotal, 0) +
        directBranches.reduce((s, b) => s + b.maxPeriode, 0)

      return {
        id: domain.id,
        name: domain.name,
        sortOrder: domain.sortOrder,
        maxPeriodeSubtotal: domainTotal,
        groups,
        branches: directBranches,
      }
    })

    return {
      id: degree.id,
      code: degree.code,
      name: degree.name,
      levels,
      needsReview: degree.needsReview,
      maxPeriodeTotal,
      maximaGeneraux: derivePrimaryMaxima(maxPeriodeTotal),
      domains,
    }
  })
}

export { primaryDegreeCodeForLevel }
