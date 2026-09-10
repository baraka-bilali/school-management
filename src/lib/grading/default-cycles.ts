import type { EvaluationCycleKind } from "@prisma/client"

export type DefaultPeriodDef = { name: string; sortOrder: number }
export type DefaultPeriodGroupDef = {
  name: string
  sortOrder: number
  hasExam: boolean
  periods: DefaultPeriodDef[]
}

export type DefaultCycleDef = {
  kind: EvaluationCycleKind
  name: string
  sections: string[]
  periodGroups: DefaultPeriodGroupDef[]
}

/** Structures par défaut Don Bosco — modifiables ensuite côté admin. */
export const DEFAULT_EVALUATION_CYCLES: DefaultCycleDef[] = [
  {
    kind: "PRIMARY",
    name: "Primaire",
    sections: ["Primaire"],
    periodGroups: [
      {
        name: "Trimestre 1",
        sortOrder: 1,
        hasExam: true,
        periods: [
          { name: "1ère période", sortOrder: 1 },
          { name: "2ème période", sortOrder: 2 },
        ],
      },
      {
        name: "Trimestre 2",
        sortOrder: 2,
        hasExam: true,
        periods: [
          { name: "1ère période", sortOrder: 1 },
          { name: "2ème période", sortOrder: 2 },
        ],
      },
      {
        name: "Trimestre 3",
        sortOrder: 3,
        hasExam: true,
        periods: [
          { name: "1ère période", sortOrder: 1 },
          { name: "2ème période", sortOrder: 2 },
        ],
      },
    ],
  },
  {
    kind: "SECONDARY",
    name: "Secondaire / Humanités",
    sections: ["Education de Base", "Humanités"],
    periodGroups: [
      {
        name: "Semestre 1",
        sortOrder: 1,
        hasExam: true,
        periods: [
          { name: "1ère période", sortOrder: 1 },
          { name: "2ème période", sortOrder: 2 },
        ],
      },
      {
        name: "Semestre 2",
        sortOrder: 2,
        hasExam: true,
        periods: [
          { name: "3ème période", sortOrder: 1 },
          { name: "4ème période", sortOrder: 2 },
        ],
      },
    ],
  },
]
