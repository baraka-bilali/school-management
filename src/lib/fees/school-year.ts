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

/**
 * Année scolaire active pour une école.
 * Priorité stricte : choix explicite dans Paramètres (school_settings.current_year_id).
 */
export async function getSchoolCurrentYearId(schoolId: number): Promise<number | null> {
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

export async function getSchoolCurrentYearName(schoolId: number): Promise<string | null> {
  const yearId = await getSchoolCurrentYearId(schoolId)
  if (!yearId) return null
  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
    select: { name: true },
  })
  return year?.name ?? null
}
