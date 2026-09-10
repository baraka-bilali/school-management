import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { compareClasses } from "@/lib/class-sort"
import { formatDegreeLabel, normalizeGradeStream } from "@/lib/grading/degree"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/**
 * Degrés pour les maxima :
 * - Primaire / EB / Maternelle : section + level (stream vide)
 * - Humanités : section + level + filière (stream), pour des pondérations distinctes
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const rows = await prisma.class.findMany({
      where: { schoolId: user.schoolId },
      select: { section: true, level: true, name: true, letter: true, stream: true },
    })

    const map = new Map<
      string,
      { section: string; level: string; stream: string; classNames: string[] }
    >()

    for (const row of rows) {
      const stream =
        row.section === "Humanités" ? normalizeGradeStream(row.stream) : ""
      const key = `${row.section}::${row.level}::${stream}`
      const cur = map.get(key) || {
        section: row.section,
        level: row.level,
        stream,
        classNames: [],
      }
      cur.classNames.push(row.name)
      map.set(key, cur)
    }

    const degrees = Array.from(map.values())
      .sort((a, b) => {
        const byClass = compareClasses(a, b)
        if (byClass !== 0) return byClass
        return a.stream.localeCompare(b.stream, "fr")
      })
      .map((d) => ({
        section: d.section,
        level: d.level,
        stream: d.stream,
        label: formatDegreeLabel(d.section, d.level, d.stream),
        classNames: d.classNames,
      }))

    return NextResponse.json({ degrees })
  } catch (error) {
    return handleApiError(error)
  }
}
