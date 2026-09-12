/** Formules officielles primaire RDC — source de vérité = maxPeriode. */

export function maxExamenFromPeriode(maxPeriode: number, override?: number | null): number {
  if (override != null && Number.isFinite(override)) return override
  return maxPeriode * 2
}

export function maxTrimestreFromPeriode(maxPeriode: number, override?: number | null): number {
  if (override != null && Number.isFinite(override)) return override
  return maxPeriode * 4
}

export function maxAnnuelFromPeriode(maxPeriode: number, override?: number | null): number {
  if (override != null && Number.isFinite(override)) return override
  return maxPeriode * 12
}

export function derivePrimaryMaxima(
  maxPeriode: number,
  overrides?: {
    maxExamenOverride?: number | null
    maxTrimestreOverride?: number | null
    maxAnnuelOverride?: number | null
  }
) {
  return {
    maxPeriode,
    maxExamen: maxExamenFromPeriode(maxPeriode, overrides?.maxExamenOverride),
    maxTrimestre: maxTrimestreFromPeriode(maxPeriode, overrides?.maxTrimestreOverride),
    maxAnnuel: maxAnnuelFromPeriode(maxPeriode, overrides?.maxAnnuelOverride),
  }
}

export function primaryDegreeCodeForLevel(level: string): "ELEMENTAIRE" | "MOYEN" | "TERMINAL_5" | "TERMINAL_6" | null {
  const n = level.trim()
  if (n === "1ère" || n === "2ème") return "ELEMENTAIRE"
  if (n === "3ème" || n === "4ème") return "MOYEN"
  if (n === "5ème") return "TERMINAL_5"
  if (n === "6ème") return "TERMINAL_6"
  return null
}
