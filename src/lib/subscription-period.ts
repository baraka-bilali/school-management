export type SubscriptionPhase = "unknown" | "upcoming" | "active" | "expired" | "suspended"

export interface SubscriptionPeriodMetrics {
  phase: SubscriptionPhase
  daysRemaining: number | null
  totalDays: number
  daysElapsed: number
  /** Barre : avance vers la fin (0 → 100). */
  progressElapsed: number
  /** Cercle : temps restant qui se vide (100 → 0). */
  progressRemaining: number
  daysUntilStart: number
}

export interface SubscriptionPaymentSlice {
  dateDebut: string | Date
  dateFin: string | Date
  statut?: string | null
  numeroFacture?: string | null
  plan?: string | null
}

export interface SubscriptionSegment {
  index: number
  dateDebut: string
  dateFin: string
  days: number
  numeroFacture?: string | null
  plan?: string | null
}

export interface CumulativeSubscriptionView {
  cumulativeStart: Date | null
  cumulativeEnd: Date | null
  totalDays: number
  subscriptionCount: number
  segments: SubscriptionSegment[]
  metrics: SubscriptionPeriodMetrics
}

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** Parse une date ISO / Date sans décalage de fuseau horaire. */
export function parseSubscriptionDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    }
  }
  return startOfDay(new Date(value))
}

function toIsoDate(value: Date | null): string | null {
  if (!value) return null
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, "0")
  const d = String(value.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Différence en jours calendaires (b - a). */
export function diffCalendarDays(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / (1000 * 60 * 60 * 24))
}

export function getSubscriptionPeriodMetrics(
  dateDebut: string | Date | null | undefined,
  dateFin: string | Date | null | undefined,
  etatCompte: string | null | undefined,
  now: Date = new Date(),
  totalDaysOverride?: number
): SubscriptionPeriodMetrics {
  const empty: SubscriptionPeriodMetrics = {
    phase: "unknown",
    daysRemaining: null,
    totalDays: 0,
    daysElapsed: 0,
    progressElapsed: 0,
    progressRemaining: 0,
    daysUntilStart: 0,
  }

  if (etatCompte === "SUSPENDU") {
    return {
      ...empty,
      phase: "suspended",
      daysRemaining: 0,
      progressElapsed: 100,
      progressRemaining: 0,
    }
  }

  const end = parseSubscriptionDate(dateFin)
  if (!end) return empty

  const today = startOfDay(now)
  const start = parseSubscriptionDate(dateDebut)

  if (today > end) {
    const totalDays =
      totalDaysOverride ?? (start ? Math.max(1, diffCalendarDays(start, end)) : 1)
    return {
      phase: "expired",
      daysRemaining: 0,
      totalDays,
      daysElapsed: totalDays,
      progressElapsed: 100,
      progressRemaining: 0,
      daysUntilStart: 0,
    }
  }

  const totalDays =
    totalDaysOverride ??
    (start ? Math.max(1, diffCalendarDays(start, end)) : Math.max(1, diffCalendarDays(today, end)))

  if (!start) {
    const daysRemaining = Math.max(0, diffCalendarDays(today, end))
    return {
      phase: "active",
      daysRemaining,
      totalDays,
      daysElapsed: Math.max(0, totalDays - daysRemaining),
      progressElapsed: Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100),
      progressRemaining: Math.min(100, (daysRemaining / totalDays) * 100),
      daysUntilStart: 0,
    }
  }

  if (today < start) {
    return {
      phase: "upcoming",
      daysRemaining: totalDays,
      totalDays,
      daysElapsed: 0,
      progressElapsed: 0,
      progressRemaining: 100,
      daysUntilStart: diffCalendarDays(today, start),
    }
  }

  const rawElapsed = diffCalendarDays(start, today) + 1
  const daysElapsed = Math.min(totalDays, Math.max(0, rawElapsed))
  const daysRemaining = Math.max(0, totalDays - daysElapsed)

  const progressElapsed = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100))
  const progressRemaining = Math.min(100, Math.max(0, (daysRemaining / totalDays) * 100))

  return {
    phase: "active",
    daysRemaining,
    totalDays,
    daysElapsed,
    progressElapsed,
    progressRemaining,
    daysUntilStart: 0,
  }
}

/**
 * Vue cumulée : plusieurs abonnements empilés (30 + 30 + … jours).
 * S'appuie sur l'historique des paiements pour le vrai début et le total.
 */
export function buildCumulativeSubscriptionView(
  schoolDateDebut: string | Date | null | undefined,
  schoolDateFin: string | Date | null | undefined,
  etatCompte: string | null | undefined,
  payments: SubscriptionPaymentSlice[],
  now: Date = new Date()
): CumulativeSubscriptionView {
  const schoolEnd = parseSubscriptionDate(schoolDateFin)
  const schoolStart = parseSubscriptionDate(schoolDateDebut)

  const sorted = [...payments]
    .filter((p) => p.statut !== "ANNULE")
    .sort(
      (a, b) =>
        (parseSubscriptionDate(a.dateDebut)?.getTime() ?? 0) -
        (parseSubscriptionDate(b.dateDebut)?.getTime() ?? 0)
    )

  const segments: SubscriptionSegment[] = sorted.map((p, i) => {
    const d0 = parseSubscriptionDate(p.dateDebut)!
    const d1 = parseSubscriptionDate(p.dateFin)!
    return {
      index: i + 1,
      dateDebut: toIsoDate(d0) ?? String(p.dateDebut),
      dateFin: toIsoDate(d1) ?? String(p.dateFin),
      days: Math.max(1, diffCalendarDays(d0, d1)),
      numeroFacture: p.numeroFacture ?? null,
      plan: p.plan ?? null,
    }
  })

  let cumulativeStart: Date | null = null
  let cumulativeEnd: Date | null = schoolEnd
  let totalDays = 0
  let subscriptionCount = 1

  if (segments.length > 0) {
    cumulativeStart = parseSubscriptionDate(segments[0].dateDebut)
    const lastSegEnd = parseSubscriptionDate(segments[segments.length - 1].dateFin)
    cumulativeEnd = schoolEnd && lastSegEnd && schoolEnd > lastSegEnd ? schoolEnd : lastSegEnd ?? schoolEnd
    totalDays = segments.reduce((sum, s) => sum + s.days, 0)
    subscriptionCount = segments.length
  } else if (schoolStart && schoolEnd) {
    cumulativeStart = schoolStart
    cumulativeEnd = schoolEnd
    totalDays = Math.max(1, diffCalendarDays(schoolStart, schoolEnd))
    subscriptionCount = 1
  }

  const metrics = getSubscriptionPeriodMetrics(
    cumulativeStart,
    cumulativeEnd,
    etatCompte,
    now,
    totalDays > 0 ? totalDays : undefined
  )

  return {
    cumulativeStart,
    cumulativeEnd,
    totalDays: totalDays || metrics.totalDays,
    subscriptionCount,
    segments,
    metrics,
  }
}

export function extendSubscriptionEnd(currentEnd: Date, extraDays: number): Date {
  const newEnd = new Date(currentEnd)
  newEnd.setDate(newEnd.getDate() + extraDays)
  newEnd.setHours(23, 59, 59, 999)
  return newEnd
}

export function newSubscriptionPeriod(
  start: Date,
  durationDays: number
): { startDate: Date; endDate: Date } {
  const startDate = startOfDay(start)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + durationDays)
  endDate.setHours(23, 59, 59, 999)
  return { startDate, endDate }
}

export { toIsoDate }
