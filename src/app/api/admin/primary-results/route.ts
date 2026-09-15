import { NextRequest, NextResponse } from "next/server"
import {
  getAuthUser,
  requireRole,
  handleApiError,
  getSchoolCurrentYearId,
} from "@/lib/fees/api-helpers"
import { ensureDefaultEvaluationCycles } from "@/lib/grading/cycles"
import {
  buildPrimaryEvents,
  loadPrimaryClassResults,
} from "@/lib/grading/primary-results"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/**
 * GET /api/admin/primary-results?periodId=&periodGroupId=&kind=
 * Class-level submission statuses for Primaire Results panel.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)
    const schoolId = user.schoolId
    const yearId = await getSchoolCurrentYearId(schoolId)

    const cycles = await ensureDefaultEvaluationCycles(schoolId)
    const primaryCycle = cycles.find((c) => c.kind === "PRIMARY") || null
    const events = buildPrimaryEvents(primaryCycle)

    const { searchParams } = new URL(req.url)
    let kind = (searchParams.get("kind") || "").toUpperCase() as "PERIOD" | "EXAM" | ""
    const periodIdRaw = searchParams.get("periodId")
    const periodGroupIdRaw = searchParams.get("periodGroupId")
    let periodId = periodIdRaw ? parseInt(periodIdRaw, 10) : null
    let periodGroupId = periodGroupIdRaw ? parseInt(periodGroupIdRaw, 10) : null

    if (!kind || (kind === "PERIOD" && !periodId) || (kind === "EXAM" && !periodGroupId)) {
      const fallback = events[0]
      if (fallback) {
        kind = fallback.kind
        periodId = fallback.periodId
        periodGroupId = fallback.periodGroupId
      } else {
        kind = "PERIOD"
      }
    }

    if (kind !== "PERIOD" && kind !== "EXAM") {
      return NextResponse.json({ error: "kind invalide (PERIOD|EXAM)" }, { status: 400 })
    }
    if (kind === "PERIOD" && !periodId) {
      return NextResponse.json({ error: "periodId requis pour PERIOD" }, { status: 400 })
    }
    if (kind === "EXAM" && !periodGroupId) {
      return NextResponse.json(
        { error: "periodGroupId requis pour EXAM" },
        { status: 400 }
      )
    }

    const classes = await loadPrimaryClassResults({
      schoolId,
      yearId,
      kind,
      periodId,
      periodGroupId,
    })

    return NextResponse.json({
      events,
      selected: {
        kind,
        periodId: kind === "PERIOD" ? periodId : null,
        periodGroupId: kind === "EXAM" ? periodGroupId : null,
      },
      // Provisional rule — see class-submission-status.ts
      submissionRuleNote:
        "Statut dérivé des GradeEntryLock par branche (soumis = tous verrouillés, partiel = certains, en attente = aucun).",
      classes,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
