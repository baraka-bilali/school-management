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
