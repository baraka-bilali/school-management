import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import {
  ensureCtebCurriculum,
  listCtebCurriculum,
} from "@/lib/grading/ensure-cteb-curriculum"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/**
 * GET /api/admin/cteb-curriculum
 * Catalogue 7ème / 8ème + maxima dérivés (période → examen×2 · semestre×4 · annuel×8).
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const sample = await prisma.subject.count({
      where: { schoolId: user.schoolId, code: { startsWith: "CTEB-" } },
    })
    if (sample === 0) {
      await ensureCtebCurriculum(user.schoolId)
    }

    const degrees = await listCtebCurriculum(user.schoolId)
    return NextResponse.json({ degrees })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST { action: "ensure" }
 * Synchronise matières CTEB + SubjectPeriodMax / SubjectExamMax.
 * N'assigne pas d'enseignants (CourseAssignment reste manuel / multi-profs).
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const body = await req.json().catch(() => ({}))
    const action = String(body.action || "ensure")

    if (action === "ensure") {
      const results = await ensureCtebCurriculum(user.schoolId)
      const degrees = await listCtebCurriculum(user.schoolId)
      return NextResponse.json({ ok: true, results, degrees })
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}
