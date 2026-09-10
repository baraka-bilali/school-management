/** Clé de filière pour les maxima : "" si absente (primaire / EB). */
export function normalizeGradeStream(stream?: string | null): string {
  return (stream || "").trim()
}

export function degreeKey(section: string, level: string, stream?: string | null): string {
  return `${section}::${level}::${normalizeGradeStream(stream)}`
}

export function formatDegreeLabel(section: string, level: string, stream?: string | null): string {
  const s = normalizeGradeStream(stream)
  if (s) return `${level} — ${section} — ${s}`
  return `${level} — ${section}`
}
