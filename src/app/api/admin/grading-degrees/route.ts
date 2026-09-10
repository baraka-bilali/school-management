import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { compareClasses } from "@/lib/class-sort"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/** Degrés distincts (section + level) présents dans les classes de l'école. */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const rows = await prisma.class.findMany({
      where: { schoolId: user.schoolId },
      select: { section: true, level: true, name: true, letter: true },
    })

    const map = new Map<string, { section: string; level: string; classNames: string[] }>()
    for (const row of rows) {
      const key = `${row.section}::${row.level}`
      const cur = map.get(key) || { section: row.section, level: row.level, classNames: [] }
      cur.classNames.push(row.name)
      map.set(key, cur)
    }

    const degrees = Array.from(map.values())
      .sort((a, b) => compareClasses(a, b))
      .map((d) => ({
        section: d.section,
        level: d.level,
        label: `${d.level} — ${d.section}`,
        classNames: d.classNames,
      }))

    return NextResponse.json({ degrees })
  } catch (error) {
    return handleApiError(error)
  }
}
