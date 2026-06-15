import { prisma } from "@/lib/prisma"

export async function ensureSchoolSettingsTable() {
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

export async function countActiveEnrollments(schoolId: number, yearId: number): Promise<number> {
  return prisma.enrollment.count({
    where: {
      yearId,
      status: "ACTIVE",
      student: { user: { schoolId } },
    },
  })
}

async function getYearWithMostEnrollments(schoolId: number): Promise<number | null> {
  const grouped = await prisma.enrollment.groupBy({
    by: ["yearId"],
    where: {
      status: "ACTIVE",
      student: { user: { schoolId } },
    },
    _count: { id: true },
  })
  if (grouped.length === 0) return null
  return grouped.sort((a, b) => b._count.id - a._count.id)[0].yearId
}

async function tryPersistSchoolCurrentYear(schoolId: number, yearId: number) {
  try {
    await ensureSchoolSettingsTable()
    await prisma.$executeRawUnsafe(
      `INSERT INTO school_settings (school_id, currency_code, usd_to_cdf_rate, current_year_id, updated_at)
       VALUES ($1, 'USD', 2800, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (school_id) DO UPDATE SET
         current_year_id = COALESCE(school_settings.current_year_id, EXCLUDED.current_year_id),
         updated_at = CURRENT_TIMESTAMP`,
      schoolId,
      yearId
    )
  } catch {
    // Non bloquant
  }
}

/**
 * Récupérer l'année scolaire courante pour une école.
 * Priorité : school_settings → année globale current → année avec inscriptions → dernière année.
 */
export async function getSchoolCurrentYearId(schoolId: number): Promise<number | null> {
  let candidate: number | null = null

  try {
    await ensureSchoolSettingsTable()
    const rows = await prisma.$queryRawUnsafe<Array<{ current_year_id: number | null }>>(
      `SELECT current_year_id FROM school_settings WHERE school_id = $1 LIMIT 1`,
      schoolId
    )
    const settingsYearId = rows[0]?.current_year_id
    if (settingsYearId) {
      const year = await prisma.academicYear.findUnique({
        where: { id: settingsYearId },
        select: { id: true },
      })
      if (year) candidate = year.id
    }
  } catch {
    // Table absente ou erreur pooler — on continue avec les fallbacks
  }

  if (!candidate) {
    const globalYear = await prisma.academicYear.findFirst({
      where: { current: true },
      select: { id: true },
    })
    candidate = globalYear?.id ?? null
  }

  const enrollmentYear = await getYearWithMostEnrollments(schoolId)
  if (enrollmentYear) {
    if (!candidate) {
      candidate = enrollmentYear
    } else {
      const count = await countActiveEnrollments(schoolId, candidate)
      if (count === 0) candidate = enrollmentYear
    }
  }

  if (!candidate) {
    const latest = await prisma.academicYear.findFirst({
      orderBy: { name: "desc" },
      select: { id: true },
    })
    candidate = latest?.id ?? null
  }

  if (candidate) {
    await tryPersistSchoolCurrentYear(schoolId, candidate)
  }

  return candidate
}
