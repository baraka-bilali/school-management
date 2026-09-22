/** Formules officielles Éducation de Base (CTEB) — 2 semestres × 2 périodes + examen. */
/** Source de vérité = maxPeriode. semestre = 2×période + examen = 4× ; annuel = 2×semestre = 8×. */

export function maxExamenFromPeriodeCteb(maxPeriode: number, override?: number | null): number {
  if (override != null && Number.isFinite(override)) return override
  return maxPeriode * 2
}

export function maxSemestreFromPeriode(maxPeriode: number, override?: number | null): number {
  if (override != null && Number.isFinite(override)) return override
  return maxPeriode * 4
}

export function maxAnnuelFromPeriodeCteb(maxPeriode: number, override?: number | null): number {
  if (override != null && Number.isFinite(override)) return override
  return maxPeriode * 8
}

export function deriveCtebMaxima(
  maxPeriode: number,
  overrides?: {
    maxExamenOverride?: number | null
    maxSemestreOverride?: number | null
    maxAnnuelOverride?: number | null
  }
) {
  return {
    maxPeriode,
    maxExamen: maxExamenFromPeriodeCteb(maxPeriode, overrides?.maxExamenOverride),
    maxSemestre: maxSemestreFromPeriode(maxPeriode, overrides?.maxSemestreOverride),
    maxAnnuel: maxAnnuelFromPeriodeCteb(maxPeriode, overrides?.maxAnnuelOverride),
  }
}

export function ctebDegreeCodeForLevel(level: string): "CTEB_7" | "CTEB_8" | null {
  const n = level.trim()
  if (n === "7ème") return "CTEB_7"
  if (n === "8ème") return "CTEB_8"
  return null
}

export const CTEB_SECTION = "Education de Base"
