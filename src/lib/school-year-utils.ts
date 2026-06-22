/**
 * Utilitaires année scolaire (septembre → juin).
 * Le libellé "2025-2026" signifie : sept. 2025 … juin 2026.
 */

export interface AnneeScolaire {
  id: number
  label: string
  dateDebut: Date
  dateFin: Date
  isCurrent?: boolean
}

export interface MoisScolaire {
  /** Format YYYY-MM, ex. "2025-09" */
  value: string
  /** Label lisible, ex. "Septembre 2025" */
  label: string
  dateDebut: Date
  dateFin: Date
}

export type PeriodShortcut = "this_month" | "this_quarter" | "this_school_year" | "custom"

/** Libellé lisible de la période filtrée (ex. « Juin 2026 », pas « Ce mois-ci »). */
export function formatPeriodSubtitle(
  shortcut: PeriodShortcut,
  monthValues: string[],
  months: MoisScolaire[]
): string {
  if (shortcut === "this_school_year") return "Année complète"
  if (monthValues.length === 1) {
    const m = months.find((x) => x.value === monthValues[0])
    return m?.label ?? monthValues[0]
  }
  if (shortcut === "this_quarter" && monthValues.length > 1) {
    const first = months.find((m) => m.value === monthValues[0])
    const last = months.find((m) => m.value === monthValues[monthValues.length - 1])
    if (first && last) return `${first.label} – ${last.label}`
    return "Trimestre en cours"
  }
  if (monthValues.length > 1) return `${monthValues.length} mois`
  return "Période sélectionnée"
}

const SCHOOL_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6] as const

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

/** Parse "2025-2026" → { startYear: 2025, endYear: 2026 } */
export function parseSchoolYearLabel(name: string): { startYear: number; endYear: number } | null {
  const match = name.match(/^(\d{4})-(\d{4})$/)
  if (!match) return null
  const startYear = parseInt(match[1], 10)
  const endYear = parseInt(match[2], 10)
  if (endYear !== startYear + 1) return null
  return { startYear, endYear }
}

/**
 * Année calendaire incluse dans l'email élève (fin d'année scolaire).
 * Ex. inscription 2025-2026 → 2026 ; 2026-2027 → 2027.
 */
export function emailYearFromAcademicYear(record: {
  name: string
  endDate?: Date | string | null
}): number {
  const parsed = parseSchoolYearLabel(record.name)
  if (parsed) return parsed.endYear
  if (record.endDate) {
    return new Date(record.endDate).getFullYear()
  }
  return new Date().getFullYear()
}

/** Bornes sept→juin à partir du libellé ou des dates en base */
export function schoolYearFromRecord(record: {
  id: number
  name: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  current?: boolean
}): AnneeScolaire {
  const parsed = parseSchoolYearLabel(record.name)
  let dateDebut: Date
  let dateFin: Date

  if (record.startDate && record.endDate) {
    dateDebut = new Date(record.startDate)
    dateFin = new Date(record.endDate)
  } else if (parsed) {
    // Année scolaire : 1er sept. N → 30 juin N+1
    dateDebut = new Date(parsed.startYear, 8, 1)
    dateFin = new Date(parsed.endYear, 5, 30, 23, 59, 59, 999)
  } else {
    const y = new Date().getFullYear()
    dateDebut = new Date(y, 8, 1)
    dateFin = new Date(y + 1, 5, 30, 23, 59, 59, 999)
  }

  return {
    id: record.id,
    label: record.name,
    dateDebut,
    dateFin,
    isCurrent: record.current,
  }
}

/** Les 10 mois scolaires (sept → juin) pour une année donnée */
export function getSchoolYearMonths(annee: AnneeScolaire): MoisScolaire[] {
  const parsed = parseSchoolYearLabel(annee.label)
  const startYear = parsed?.startYear ?? annee.dateDebut.getFullYear()

  return SCHOOL_MONTHS.map((month) => {
    const calendarYear = month >= 9 ? startYear : startYear + 1
    const value = `${calendarYear}-${String(month).padStart(2, "0")}`
    const dateDebut = new Date(calendarYear, month - 1, 1)
    const dateFin = new Date(calendarYear, month, 0, 23, 59, 59, 999)
    return {
      value,
      label: `${MONTH_NAMES_FR[month - 1]} ${calendarYear}`,
      dateDebut,
      dateFin,
    }
  })
}

export function isMonthInSchoolYear(yyyyMM: string, annee: AnneeScolaire): boolean {
  return getSchoolYearMonths(annee).some((m) => m.value === yyyyMM)
}

export function getCurrentSchoolMonthValue(now = new Date()): string {
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  return `${y}-${String(m).padStart(2, "0")}`
}

/** Trimestres scolaires : T1 sept-nov, T2 déc-fév, T3 mars-juin */
export function getCurrentQuarterMonthValues(annee: AnneeScolaire, now = new Date()): string[] {
  const months = getSchoolYearMonths(annee)
  const current = getCurrentSchoolMonthValue(now)
  const idx = months.findIndex((m) => m.value === current)
  if (idx < 0) return months.map((m) => m.value)

  let startIdx = 0
  if (idx <= 2) startIdx = 0
  else if (idx <= 5) startIdx = 3
  else startIdx = 6

  return months.slice(startIdx, Math.min(startIdx + 3, months.length)).map((m) => m.value)
}

export interface PeriodBounds {
  monthValues: string[]
  dateFrom: Date
  dateTo: Date
  shortcut: PeriodShortcut
}

export function computePeriodBounds(
  shortcut: PeriodShortcut,
  annee: AnneeScolaire,
  customMonth?: string,
  now = new Date()
): PeriodBounds {
  const allMonths = getSchoolYearMonths(annee)

  if (shortcut === "this_school_year") {
    return {
      monthValues: allMonths.map((m) => m.value),
      dateFrom: annee.dateDebut,
      dateTo: annee.dateFin,
      shortcut,
    }
  }

  if (shortcut === "this_month") {
    const current = getCurrentSchoolMonthValue(now)
    const month = allMonths.find((m) => m.value === current) ?? allMonths[allMonths.length - 1]
    return {
      monthValues: [month.value],
      dateFrom: month.dateDebut,
      dateTo: month.dateFin,
      shortcut,
    }
  }

  if (shortcut === "this_quarter") {
    const quarterValues = getCurrentQuarterMonthValues(annee, now)
    const selected = allMonths.filter((m) => quarterValues.includes(m.value))
    return {
      monthValues: quarterValues,
      dateFrom: selected[0]?.dateDebut ?? annee.dateDebut,
      dateTo: selected[selected.length - 1]?.dateFin ?? annee.dateFin,
      shortcut,
    }
  }

  // custom — mois précis ou tous les mois de l'année
  if (customMonth) {
    const month = allMonths.find((m) => m.value === customMonth)
    if (month) {
      return {
        monthValues: [month.value],
        dateFrom: month.dateDebut,
        dateTo: month.dateFin,
        shortcut: "custom",
      }
    }
  }

  return {
    monthValues: allMonths.map((m) => m.value),
    dateFrom: annee.dateDebut,
    dateTo: annee.dateFin,
    shortcut: "custom",
  }
}

export function formatAcademicYearOptionLabel(name: string, isCurrent: boolean): string {
  return isCurrent ? `${name} (en cours)` : name
}

/** Année active définie dans Paramètres (priorité sur le flag Prisma `current`). */
export function isAcademicYearCurrent(
  yearId: number,
  currentYearId?: number | null,
  year?: { isCurrent?: boolean; current?: boolean }
): boolean {
  if (currentYearId != null) return yearId === currentYearId
  if (year?.isCurrent !== undefined) return year.isCurrent
  if (year?.current !== undefined) return year.current
  return false
}

/** Génère la liste des années scolaires à partir des enregistrements Prisma */
export function mapAcademicYearsToAnnees(
  years: Array<{ id: number; name: string; startDate?: Date | string | null; endDate?: Date | string | null; current?: boolean }>,
  currentYearId?: number | null
): AnneeScolaire[] {
  return years
    .map((y) =>
      schoolYearFromRecord({
        ...y,
        current: currentYearId ? y.id === currentYearId : y.current,
      })
    )
    .sort((a, b) => b.dateDebut.getTime() - a.dateDebut.getTime())
}

export function formatMonthLabel(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-").map(Number)
  if (!y || !m) return yyyyMM
  return `${MONTH_NAMES_FR[m - 1]} ${y}`
}
