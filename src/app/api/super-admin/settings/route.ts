import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"
const DEFAULT_CURRENCY = "USD"
const DEFAULT_EXCHANGE_RATE = 2800

async function requireSuperAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("Cookie") || ""
  const tokenMatch = cookieHeader.match(/token=([^;]+)/)

  if (!tokenMatch) return null

  try {
    const decoded = jwt.verify(tokenMatch[1], JWT_SECRET) as { role?: string }
    return decoded.role === "SUPER_ADMIN" ? decoded : null
  } catch {
    return null
  }
}

async function ensureSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id INTEGER PRIMARY KEY,
      currency_code TEXT NOT NULL DEFAULT 'USD',
      usd_to_cdf_rate DOUBLE PRECISION NOT NULL DEFAULT 2800,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await prisma.$executeRawUnsafe(`
    INSERT INTO platform_settings (id, currency_code, usd_to_cdf_rate, updated_at)
    VALUES (1, 'USD', 2800, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING
  `)
}

async function getSettings() {
  await ensureSettingsTable()

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      currency_code: string
      usd_to_cdf_rate: number
      updated_at: Date
    }>
  >(`
    SELECT currency_code, usd_to_cdf_rate, updated_at
    FROM platform_settings
    WHERE id = 1
    LIMIT 1
  `)

  const row = rows[0]

  return {
    currency: row?.currency_code || DEFAULT_CURRENCY,
    exchangeRate: Number(row?.usd_to_cdf_rate || DEFAULT_EXCHANGE_RATE),
    updatedAt: row?.updated_at || new Date(),
  }
}

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin(req)
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error("Error loading platform settings:", error)
    return NextResponse.json({ error: "Impossible de charger les paramètres" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const user = await requireSuperAdmin(req)
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const currency = body.currency === "CDF" ? "CDF" : "USD"
    const exchangeRate = Number(body.exchangeRate)

    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      return NextResponse.json({ error: "Taux de change invalide" }, { status: 400 })
    }

    await ensureSettingsTable()
    await prisma.$executeRawUnsafe(
      `
        UPDATE platform_settings
        SET currency_code = $1,
            usd_to_cdf_rate = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `,
      currency,
      exchangeRate
    )

    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error("Error saving platform settings:", error)
    return NextResponse.json({ error: "Impossible d'enregistrer les paramètres" }, { status: 500 })
  }
}
