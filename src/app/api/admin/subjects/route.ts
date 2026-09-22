import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { purgeNonCatalogSubjects } from "@/lib/grading/bulletin-subjects"
import { ensureCtebCurriculum } from "@/lib/grading/ensure-cteb-curriculum"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/**
 * GET /api/admin/subjects
 * Par défaut : uniquement les matières du bulletin CTEB (EB).
 * ?includePrimary=1 : ajoute aussi les matières canoniques primaire.
 * Purge les matières libres (créées manuellement) à chaque chargement.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const { searchParams } = new URL(req.url)
    const includePrimary = searchParams.get("includePrimary") === "1"

    const purge = await purgeNonCatalogSubjects(user.schoolId)

    const ctebCount = await prisma.subject.count({
      where: {
        schoolId: user.schoolId,
        isActive: true,
        code: { startsWith: "CTEB-" },
      },
    })
    if (ctebCount === 0) {
      try {
        await ensureCtebCurriculum(user.schoolId)
      } catch (err) {
        console.error("[admin/subjects] ensure CTEB:", err)
      }
    }

    const where: Prisma.SubjectWhereInput = {
      schoolId: user.schoolId,
      isActive: true,
      ...(includePrimary
        ? {
            OR: [
              { code: { startsWith: "CTEB-" } },
              { code: { startsWith: "PRI-" } },
              { primaryBranches: { some: {} } },
            ],
          }
        : { code: { startsWith: "CTEB-" } }),
    }

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: [{ groupLabel: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({
      subjects,
      purgedManual: purge.purged,
      purgedSubjects: purge.subjects,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST — création libre désactivée.
 * Les matières EB viennent du catalogue bulletin (sync CTEB).
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const body = await req.json().catch(() => ({}))
    if (body?.action === "purgeManual") {
      const purge = await purgeNonCatalogSubjects(user.schoolId)
      return NextResponse.json({ ok: true, ...purge })
    }

    if (body?.action === "ensureCteb") {
      await purgeNonCatalogSubjects(user.schoolId)
      const results = await ensureCtebCurriculum(user.schoolId)
      const subjects = await prisma.subject.findMany({
        where: {
          schoolId: user.schoolId,
          isActive: true,
          code: { startsWith: "CTEB-" },
        },
        orderBy: [{ groupLabel: "asc" }, { name: "asc" }],
      })
      return NextResponse.json({ ok: true, results, subjects })
    }

    return NextResponse.json(
      {
        error:
          "La création libre de matières est désactivée. Utilisez Notes & Bulletins → Branches EB (synchroniser le catalogue) ou Branches primaire.",
      },
      { status: 400 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
