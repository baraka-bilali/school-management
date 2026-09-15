/**
 * Provisional "class submitted" rule for Results status.
 *
 * Derived from per-branch GradeEntryLock for the selected period/exam event
 * compared to active CourseAssignments for the class:
 *   - soumis     = all assigned branches have an active lock
 *   - partiel    = some (but not all) branches locked
 *   - en_attente = no locks (or no assignments)
 *
 * This is intentionally provisional and can be adjusted once product confirms
 * a definitive school-wide "classe soumise" rule (e.g. titulaire validation,
 * enrollment completeness, etc.).
 */

export type ClassSubmissionStatus = "soumis" | "partiel" | "en_attente"

export function bulletinEventKey(
  kind: "PERIOD" | "EXAM",
  periodId?: number | null,
  periodGroupId?: number | null
): string {
  if (kind === "PERIOD") return `PERIOD:${periodId ?? 0}`
  return `EXAM:${periodGroupId ?? 0}`
}

export function deriveClassSubmissionStatus(params: {
  totalBranches: number
  lockedBranches: number
}): {
  status: ClassSubmissionStatus
  lockedCount: number
  totalCount: number
} {
  const totalCount = Math.max(0, params.totalBranches)
  const lockedCount = Math.max(0, Math.min(params.lockedBranches, totalCount))

  if (totalCount === 0 || lockedCount === 0) {
    return { status: "en_attente", lockedCount, totalCount }
  }
  if (lockedCount >= totalCount) {
    return { status: "soumis", lockedCount, totalCount }
  }
  return { status: "partiel", lockedCount, totalCount }
}

export function submissionStatusLabel(status: ClassSubmissionStatus): string {
  switch (status) {
    case "soumis":
      return "Soumis"
    case "partiel":
      return "Partiel"
    case "en_attente":
      return "En attente"
  }
}
