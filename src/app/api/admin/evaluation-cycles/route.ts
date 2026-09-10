import { NextRequest, NextResponse } from "next/server"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import {
  ensureDefaultEvaluationCycles,
  listEvaluationCycles,
} from "@/lib/grading/cycles"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const { searchParams } = new URL(req.url)
    const ensure = searchParams.get("ensureDefaults") === "1"

    const cycles = ensure
      ? await ensureDefaultEvaluationCycles(user.schoolId)
      : await listEvaluationCycles(user.schoolId)

    return NextResponse.json({ cycles })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const body = await req.json().catch(() => ({}))
    if (body?.action === "ensureDefaults" || body?.ensureDefaults) {
      const cycles = await ensureDefaultEvaluationCycles(user.schoolId)
      return NextResponse.json({ cycles })
    }

    return NextResponse.json({ error: "Action non supportée" }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}
