export const SECTION_ORDER = ["Maternelle", "Primaire", "Education de Base", "Humanités"] as const

export const LEVELS_BY_SECTION: Record<string, string[]> = {
  Maternelle: ["Petite Section", "Moyenne Section", "Grande Section"],
  Primaire: ["1ère", "2ème", "3ème", "4ème", "5ème", "6ème"],
  "Education de Base": ["7ème", "8ème"],
  Humanités: ["1ère", "2ème", "3ème", "4ème"],
}

export interface ClassSortable {
  section: string
  level: string
  letter?: string
}

export function compareClasses(a: ClassSortable, b: ClassSortable): number {
  const sectionA = SECTION_ORDER.indexOf(a.section as (typeof SECTION_ORDER)[number])
  const sectionB = SECTION_ORDER.indexOf(b.section as (typeof SECTION_ORDER)[number])
  const sA = sectionA === -1 ? 999 : sectionA
  const sB = sectionB === -1 ? 999 : sectionB
  if (sA !== sB) return sA - sB

  const levels = LEVELS_BY_SECTION[a.section] ?? []
  const ai = levels.indexOf(a.level)
  const bi = levels.indexOf(b.level)
  const aIdx = ai === -1 ? 999 : ai
  const bIdx = bi === -1 ? 999 : bi
  if (aIdx !== bIdx) return aIdx - bIdx

  return (a.letter || "").localeCompare(b.letter || "")
}

export const SECTION_LABELS: Record<string, string> = {
  Maternelle: "Maternelle",
  Primaire: "Primaire",
  "Education de Base": "Éducation de Base",
  Humanités: "Humanités",
}

export function sortClasses<T extends ClassSortable>(classes: T[]): T[] {
  return [...classes].sort(compareClasses)
}
