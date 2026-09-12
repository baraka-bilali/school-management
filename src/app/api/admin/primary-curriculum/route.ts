import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import {
  ensurePrimaryCurriculum,
  listPrimaryCurriculum,
} from "@/lib/grading/ensure-primary-curriculum"
import { derivePrimaryMaxima } from "@/lib/grading/primary-maxima"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const existing = await prisma.primaryDegree.count({ where: { schoolId: user.schoolId } })
    if (existing === 0) {
      await ensurePrimaryCurriculum(user.schoolId)
    }

    const degrees = await listPrimaryCurriculum(user.schoolId)
    return NextResponse.json({ degrees })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const body = await req.json()
    const action = String(body.action || "ensure")

    if (action === "ensure") {
      const results = await ensurePrimaryCurriculum(user.schoolId)
      const degrees = await listPrimaryCurriculum(user.schoolId)
      return NextResponse.json({ ok: true, results, degrees })
    }

    if (action === "confirmReview") {
      const degreeId = parseInt(body.degreeId, 10)
      if (!degreeId) {
        return NextResponse.json({ error: "degreeId requis" }, { status: 400 })
      }
      const degree = await prisma.primaryDegree.findFirst({
        where: { id: degreeId, schoolId: user.schoolId },
      })
      if (!degree) {
        return NextResponse.json({ error: "Degré introuvable" }, { status: 404 })
      }
      await prisma.primaryDegree.update({
        where: { id: degreeId },
        data: { needsReview: false },
      })
      const degrees = await listPrimaryCurriculum(user.schoolId)
      return NextResponse.json({ ok: true, degrees })
    }

    if (action === "updateBranch") {
      const branchId = parseInt(body.branchId, 10)
      const maxPeriode = Number(body.maxPeriode)
      if (!branchId || !Number.isFinite(maxPeriode) || maxPeriode <= 0) {
        return NextResponse.json({ error: "branchId et maxPeriode (>0) requis" }, { status: 400 })
      }

      const branch = await prisma.primaryBranch.findFirst({
        where: { id: branchId, domain: { degree: { schoolId: user.schoolId } } },
      })
      if (!branch) {
        return NextResponse.json({ error: "Branche introuvable" }, { status: 404 })
      }

      const parseOverride = (v: unknown) => {
        if (v === null || v === "") return null
        if (v === undefined) return undefined
        const n = Number(v)
        return Number.isFinite(n) ? n : undefined
      }

      const maxExamenOverride = parseOverride(body.maxExamenOverride)
      const maxTrimestreOverride = parseOverride(body.maxTrimestreOverride)
      const maxAnnuelOverride = parseOverride(body.maxAnnuelOverride)

      await prisma.primaryBranch.update({
        where: { id: branchId },
        data: {
          maxPeriode,
          ...(maxExamenOverride !== undefined ? { maxExamenOverride } : {}),
          ...(maxTrimestreOverride !== undefined ? { maxTrimestreOverride } : {}),
          ...(maxAnnuelOverride !== undefined ? { maxAnnuelOverride } : {}),
        },
      })

      await ensurePrimaryCurriculum(user.schoolId)

      const updated = await prisma.primaryBranch.findUnique({ where: { id: branchId } })
      const degrees = await listPrimaryCurriculum(user.schoolId)
      return NextResponse.json({
        ok: true,
        branch: updated
          ? {
              ...updated,
              maxima: derivePrimaryMaxima(updated.maxPeriode, {
                maxExamenOverride: updated.maxExamenOverride,
                maxTrimestreOverride: updated.maxTrimestreOverride,
                maxAnnuelOverride: updated.maxAnnuelOverride,
              }),
            }
          : null,
        degrees,
      })
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}
