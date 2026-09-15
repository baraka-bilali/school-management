import { NextRequest, NextResponse } from "next/server"
import {
  getAuthUser,
  requireRole,
  handleApiError,
  getSchoolCurrentYearId,
} from "@/lib/fees/api-helpers"
import { loadClassStudentsAlpha } from "@/lib/grading/primary-bulletin"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/**
 * GET /api/admin/primary-results/students?classId=
 * Élèves actifs de la classe, tri alphabétique (nom / postnom / prénom).
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)
    const schoolId = user.schoolId
    const yearId = await getSchoolCurrentYearId(schoolId)
    if (!yearId) {
      return NextResponse.json(
        { error: "Aucune année scolaire active" },
        { status: 400 }
      )
    }

    const classId = parseInt(
      new URL(req.url).searchParams.get("classId") || "",
      10
    )
    if (!Number.isFinite(classId)) {
      return NextResponse.json({ error: "classId requis" }, { status: 400 })
    }

    const students = await loadClassStudentsAlpha({
      schoolId,
      yearId,
      classId,
    })

    return NextResponse.json({ students })
  } catch (error) {
    if (error instanceof Error && /introuvable/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return handleApiError(error)
  }
}
