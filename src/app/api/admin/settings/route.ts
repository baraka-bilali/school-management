import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { ensureSchoolSettingsTable, invalidateSchoolYearCache } from "@/lib/fees/school-year"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

function requireAdmin(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (!["ADMIN", "SUPER_ADMIN"].includes(decoded.role)) return null
    return decoded
  } catch {
    return null
  }
}

async function ensureSchoolSettingsTableLocal() {
  await ensureSchoolSettingsTable()
}

async function getSchoolSettings(schoolId: number) {
  await ensureSchoolSettingsTableLocal()

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      currency_code: string
      usd_to_cdf_rate: number
      current_year_id: number | null
      updated_at: Date
    }>
  >(
    `SELECT currency_code, usd_to_cdf_rate, current_year_id, updated_at
     FROM school_settings
     WHERE school_id = $1
     LIMIT 1`,
    schoolId
  )

  const row = rows[0]
  return {
    currency: row?.currency_code || "USD",
    exchangeRate: Number(row?.usd_to_cdf_rate || 2800),
    currentYearId: row?.current_year_id || null,
    updatedAt: row?.updated_at || null,
  }
}

export async function GET(req: NextRequest) {
  const user = requireAdmin(req)
  if (!user || !user.schoolId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const settings = await getSchoolSettings(user.schoolId)
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Erreur chargement paramètres école:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const user = requireAdmin(req)
  if (!user || !user.schoolId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const currency = body.currency === "CDF" ? "CDF" : "USD"
    const exchangeRate = Number(body.exchangeRate)
    const currentYearId = body.currentYearId ? Number(body.currentYearId) : null

    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      return NextResponse.json({ error: "Taux de change invalide" }, { status: 400 })
    }

    await ensureSchoolSettingsTableLocal()
    await prisma.$executeRawUnsafe(
      `INSERT INTO school_settings (school_id, currency_code, usd_to_cdf_rate, current_year_id, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (school_id) DO UPDATE SET
         currency_code = EXCLUDED.currency_code,
         usd_to_cdf_rate = EXCLUDED.usd_to_cdf_rate,
         current_year_id = EXCLUDED.current_year_id,
         updated_at = CURRENT_TIMESTAMP`,
      user.schoolId,
      currency,
      exchangeRate,
      currentYearId
    )

    invalidateSchoolYearCache(user.schoolId)

    const settings = await getSchoolSettings(user.schoolId)
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Erreur sauvegarde paramètres école:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
