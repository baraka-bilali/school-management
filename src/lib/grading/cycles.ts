import { prisma } from "@/lib/prisma"
import { DEFAULT_EVALUATION_CYCLES } from "@/lib/grading/default-cycles"

const cycleInclude = {
  sections: true,
  periodGroups: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      periods: { orderBy: { sortOrder: "asc" as const } },
    },
  },
}

export async function listEvaluationCycles(schoolId: number) {
  return prisma.evaluationCycle.findMany({
    where: { schoolId },
    include: cycleInclude,
    orderBy: { kind: "asc" },
  })
}

/**
 * Align period names on PRIMARY cycles that still use the old per-trimester
 * reset (1ère/2ème in T2 and T3) onto continuous numbering (3–4, 5–6).
 * Only renames exact legacy defaults so custom admin labels are preserved.
 */
async function repairPrimaryPeriodNames(schoolId: number) {
  const cycle = await prisma.evaluationCycle.findUnique({
    where: { schoolId_kind: { schoolId, kind: "PRIMARY" } },
    include: {
      periodGroups: {
        orderBy: { sortOrder: "asc" },
        include: { periods: { orderBy: { sortOrder: "asc" } } },
      },
    },
  })
  if (!cycle) return

  const primaryDef = DEFAULT_EVALUATION_CYCLES.find((d) => d.kind === "PRIMARY")
  if (!primaryDef) return

  const legacyNames = new Set(["1ère période", "2ème période"])

  for (const groupDef of primaryDef.periodGroups) {
    if (groupDef.sortOrder === 1) continue
    const group = cycle.periodGroups.find((g) => g.sortOrder === groupDef.sortOrder)
    if (!group) continue

    for (const periodDef of groupDef.periods) {
      const period = group.periods.find((p) => p.sortOrder === periodDef.sortOrder)
      if (!period) continue
      if (period.name === periodDef.name) continue
      if (!legacyNames.has(period.name)) continue

      await prisma.period.update({
        where: { id: period.id },
        data: { name: periodDef.name },
      })
    }
  }
}

/** Crée les cycles PRIMARY / SECONDARY s'ils n'existent pas encore pour l'école. */
export async function ensureDefaultEvaluationCycles(schoolId: number) {
  for (const def of DEFAULT_EVALUATION_CYCLES) {
    const existing = await prisma.evaluationCycle.findUnique({
      where: { schoolId_kind: { schoolId, kind: def.kind } },
    })
    if (existing) continue

    await prisma.evaluationCycle.create({
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
    })
  }

  await repairPrimaryPeriodNames(schoolId)

  return listEvaluationCycles(schoolId)
}

export async function findCycleForSection(schoolId: number, section: string) {
  return prisma.evaluationCycle.findFirst({
    where: {
      schoolId,
      isActive: true,
      sections: { some: { section } },
    },
    include: cycleInclude,
  })
}
