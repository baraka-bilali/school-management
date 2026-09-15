import { NextRequest, NextResponse } from "next/server"
import {
  getAuthUser,
  requireRole,
  handleApiError,
  getSchoolCurrentYearId,
} from "@/lib/fees/api-helpers"
import { loadPrimaryBulletins } from "@/lib/grading/primary-bulletin"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/**
 * GET /api/admin/primary-results/bulletin
 * ?classId=&kind=PERIOD|EXAM&periodId=&periodGroupId=&enrollmentId=
 * Données structurées pour aperçu / impression PDF des bulletins primaire.
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

    const { searchParams } = new URL(req.url)
    const classId = parseInt(searchParams.get("classId") || "", 10)
    const kind = (searchParams.get("kind") || "").toUpperCase() as
      | "PERIOD"
      | "EXAM"
    const periodIdRaw = searchParams.get("periodId")
    const periodGroupIdRaw = searchParams.get("periodGroupId")
    const enrollmentIdRaw = searchParams.get("enrollmentId")
    const periodId = periodIdRaw ? parseInt(periodIdRaw, 10) : null
    const periodGroupId = periodGroupIdRaw ? parseInt(periodGroupIdRaw, 10) : null
    const enrollmentId = enrollmentIdRaw ? parseInt(enrollmentIdRaw, 10) : null

    if (!Number.isFinite(classId)) {
      return NextResponse.json({ error: "classId requis" }, { status: 400 })
    }
    if (kind !== "PERIOD" && kind !== "EXAM") {
      return NextResponse.json(
        { error: "kind invalide (PERIOD|EXAM)" },
        { status: 400 }
      )
    }
    if (kind === "PERIOD" && !periodId) {
      return NextResponse.json(
        { error: "periodId requis pour PERIOD" },
        { status: 400 }
      )
    }
    if (kind === "EXAM" && !periodGroupId) {
      return NextResponse.json(
        { error: "periodGroupId requis pour EXAM" },
        { status: 400 }
      )
    }

    const data = await loadPrimaryBulletins({
      schoolId,
      yearId,
      classId,
      kind,
      periodId,
      periodGroupId,
      enrollmentId,
    })

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof Error && /introuvable|invalide/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return handleApiError(error)
  }
}
