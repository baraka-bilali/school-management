/**
 * Normalise les points d'une période sur le maximum officiel de la matière.
 * Méthode-agnostique : ratio (obtenu / max colonnes) × max officiel.
 */
export function normalizePeriodResult(params: {
  sumObtained: number
  sumColumnMax: number
  officialMax: number
}): number | null {
  const { sumObtained, sumColumnMax, officialMax } = params
  if (sumColumnMax <= 0 || officialMax < 0) return null
  if (!Number.isFinite(sumObtained) || !Number.isFinite(officialMax)) return null
  return (sumObtained / sumColumnMax) * officialMax
}

/** Total trimestre/semestre = P1 + P2 + … + examen (addition stricte). */
export function sumPeriodGroupTotal(parts: Array<number | null | undefined>): number | null {
  const values = parts.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0)
}

export function roundGrade(value: number, decimals = 2): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}
