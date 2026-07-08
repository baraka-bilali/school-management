import { prisma } from "@/lib/prisma"

// Le DDL "CREATE TABLE IF NOT EXISTS" ne doit s'exécuter qu'une fois par
// instance de serveur (et non à chaque requête, ce qui était très coûteux
// en production). On mémorise la promesse résolue.
let settingsTableEnsured: Promise<void> | null = null

async function runEnsureSchoolSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS school_settings (
      school_id INTEGER PRIMARY KEY,
      currency_code TEXT NOT NULL DEFAULT 'USD',
      usd_to_cdf_rate DOUBLE PRECISION NOT NULL DEFAULT 2800,
      current_year_id INTEGER,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function ensureSchoolSettingsTable() {
  if (!settingsTableEnsured) {
    settingsTableEnsured = runEnsureSchoolSettingsTable().catch((e) => {
      // En cas d'échec, on autorise une nouvelle tentative au prochain appel.
      settingsTableEnsured = null
      throw e
    })
  }
  return settingsTableEnsured
}

// Cache mémoire de l'année scolaire courante par école (TTL court).
// Évite plusieurs requêtes DB sur quasiment chaque requête API authentifiée.
const YEAR_CACHE_TTL_MS = 60_000
const yearCache = new Map<number, { value: number | null; expires: number }>()

/** À appeler après modification de l'année courante (paramètres école). */
export function invalidateSchoolYearCache(schoolId?: number) {
  if (schoolId == null) yearCache.clear()
  else yearCache.delete(schoolId)
}

export async function countActiveEnrollments(schoolId: number, yearId: number): Promise<number> {
  return prisma.enrollment.count({
    where: {
      yearId,
      status: "ACTIVE",
      student: { user: { schoolId } },
    },
  })
}

async function readSettingsYearId(schoolId: number): Promise<number | null> {
  try {
    await ensureSchoolSettingsTable()
    const rows = await prisma.$queryRawUnsafe<Array<{ current_year_id: number | null }>>(
      `SELECT current_year_id FROM school_settings WHERE school_id = $1 LIMIT 1`,
      schoolId
    )
    const id = rows[0]?.current_year_id
    if (!id) return null
    const year = await prisma.academicYear.findUnique({
      where: { id },
      select: { id: true },
    })
    return year?.id ?? null
  } catch {
    return null
  }
}

async function resolveSchoolCurrentYearId(schoolId: number): Promise<number | null> {
  const fromSettings = await readSettingsYearId(schoolId)
  if (fromSettings) return fromSettings

  const globalYear = await prisma.academicYear.findFirst({
    where: { current: true },
    select: { id: true },
  })
  if (globalYear) return globalYear.id

  const latest = await prisma.academicYear.findFirst({
    orderBy: { name: "desc" },
    select: { id: true },
  })
  return latest?.id ?? null
}

/**
 * Année scolaire active pour une école.
 * Priorité stricte : choix explicite dans Paramètres (school_settings.current_year_id).
 * Résultat mis en cache mémoire pendant {@link YEAR_CACHE_TTL_MS}.
 */
export async function getSchoolCurrentYearId(schoolId: number): Promise<number | null> {
  const cached = yearCache.get(schoolId)
  if (cached && cached.expires > Date.now()) return cached.value

  const value = await resolveSchoolCurrentYearId(schoolId)
  yearCache.set(schoolId, { value, expires: Date.now() + YEAR_CACHE_TTL_MS })
  return value
}

export async function getSchoolCurrentYearName(schoolId: number): Promise<string | null> {
  const yearId = await getSchoolCurrentYearId(schoolId)
  if (!yearId) return null
  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
    select: { name: true },
  })
  return year?.name ?? null
}
