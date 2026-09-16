import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getAuthUser,
  requireRole,
  handleApiError,
  getSchoolCurrentYearId,
} from "@/lib/fees/api-helpers"
import { bulletinEventKey } from "@/lib/grading/class-submission-status"
import { loadPrimaryClassResults } from "@/lib/grading/primary-results"
import { PRIMARY_PERIOD_COLUMN_LABEL } from "@/lib/grading/primary-cotation"

async function countOfficialGrades(params: {
  schoolId: number
  yearId: number | null
  classId: number
  kind: "PERIOD" | "EXAM"
  periodId?: number | null
  periodGroupId?: number | null
}): Promise<number> {
  const assignments = params.yearId
    ? await prisma.courseAssignment.findMany({
        where: {
          schoolId: params.schoolId,
          yearId: params.yearId,
          classId: params.classId,
          isActive: true,
        },
        select: { id: true },
      })
    : []
  const assignmentIds = assignments.map((a) => a.id)
  if (assignmentIds.length === 0) return 0

  if (params.kind === "PERIOD" && params.periodId) {
    return prisma.grade.count({
      where: {
        enrollment: {
          classId: params.classId,
          yearId: params.yearId ?? undefined,
          status: "ACTIVE",
        },
        column: {
          periodId: params.periodId,
          label: PRIMARY_PERIOD_COLUMN_LABEL,
          courseAssignmentId: { in: assignmentIds },
        },
      },
    })
  }
  if (params.kind === "EXAM" && params.periodGroupId) {
    return prisma.examGrade.count({
      where: {
        periodGroupId: params.periodGroupId,
        courseAssignmentId: { in: assignmentIds },
        enrollment: {
          classId: params.classId,
          yearId: params.yearId ?? undefined,
          status: "ACTIVE",
        },
      },
    })
  }
  return 0
}

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

type PublishItem = {
  classId: number
  kind: "PERIOD" | "EXAM"
  periodId?: number | null
  periodGroupId?: number | null
}

/**
 * POST /api/admin/bulletin-publications
 * Body: { items: PublishItem[] } or single { classId, kind, periodId?, periodGroupId? }
 *
 * Publishes only classes that are fully "soumis" under the provisional lock rule.
 * Creates a light BulletinPublication record (display lock); full grade snapshot later.
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)
    const schoolId = user.schoolId
    const yearId = await getSchoolCurrentYearId(schoolId)

    const body = await req.json().catch(() => ({}))
    const rawItems: PublishItem[] = Array.isArray(body.items)
      ? body.items
      : body.classId
        ? [
            {
              classId: Number(body.classId),
              kind: body.kind,
              periodId: body.periodId ?? null,
              periodGroupId: body.periodGroupId ?? null,
            },
          ]
        : []

    if (rawItems.length === 0) {
      return NextResponse.json({ error: "Aucune classe à publier" }, { status: 400 })
    }

    const normalized: PublishItem[] = []
    for (const item of rawItems) {
      const kind = String(item.kind || "").toUpperCase()
      if (kind !== "PERIOD" && kind !== "EXAM") {
        return NextResponse.json({ error: "kind invalide" }, { status: 400 })
      }
      const classId = Number(item.classId)
      if (!Number.isFinite(classId)) {
        return NextResponse.json({ error: "classId invalide" }, { status: 400 })
      }
      const periodId =
        kind === "PERIOD" && item.periodId != null ? Number(item.periodId) : null
      const periodGroupId =
        kind === "EXAM" && item.periodGroupId != null ? Number(item.periodGroupId) : null
      if (kind === "PERIOD" && !periodId) {
        return NextResponse.json({ error: "periodId requis" }, { status: 400 })
      }
      if (kind === "EXAM" && !periodGroupId) {
        return NextResponse.json({ error: "periodGroupId requis" }, { status: 400 })
      }
      normalized.push({
        classId,
        kind: kind as "PERIOD" | "EXAM",
        periodId,
        periodGroupId,
      })
    }

    // Group by event so we can validate submission status once per event.
    const byEvent = new Map<string, PublishItem[]>()
    for (const item of normalized) {
      const key = `${item.kind}:${item.periodId ?? ""}:${item.periodGroupId ?? ""}`
      const list = byEvent.get(key) || []
      list.push(item)
      byEvent.set(key, list)
    }

    const published: Array<{ classId: number; publicationId: number }> = []
    const skipped: Array<{ classId: number; reason: string }> = []

    for (const items of byEvent.values()) {
      const sample = items[0]
      const statuses = await loadPrimaryClassResults({
        schoolId,
        yearId,
        kind: sample.kind,
        periodId: sample.periodId,
        periodGroupId: sample.periodGroupId,
      })
      const statusByClass = new Map(statuses.map((s) => [s.classId, s]))

      for (const item of items) {
        const cls = await prisma.class.findFirst({
          where: { id: item.classId, schoolId, section: "Primaire" },
          select: { id: true },
        })
        if (!cls) {
          skipped.push({ classId: item.classId, reason: "Classe introuvable" })
          continue
        }
        const st = statusByClass.get(item.classId)
        if (!st || st.status !== "soumis") {
          skipped.push({
            classId: item.classId,
            reason: "Publication réservée aux classes entièrement soumises",
          })
          continue
        }

        const gradeCount = await countOfficialGrades({
          schoolId,
          yearId,
          classId: item.classId,
          kind: item.kind,
          periodId: item.periodId,
          periodGroupId: item.periodGroupId,
        })
        if (gradeCount === 0) {
          skipped.push({
            classId: item.classId,
            reason:
              "Aucune note officielle saisie pour cet événement — publication annulée",
          })
          continue
        }

        const eventKey = bulletinEventKey(item.kind, item.periodId, item.periodGroupId)
        const row = await prisma.bulletinPublication.upsert({
          where: {
            classId_eventKey: { classId: item.classId, eventKey },
          },
          create: {
            schoolId,
            classId: item.classId,
            kind: item.kind,
            periodId: item.kind === "PERIOD" ? item.periodId : null,
            periodGroupId: item.kind === "EXAM" ? item.periodGroupId : null,
            eventKey,
            publishedByUserId: user.id,
          },
          update: {
            publishedAt: new Date(),
            publishedByUserId: user.id,
          },
        })
        published.push({ classId: item.classId, publicationId: row.id })
      }
    }

    return NextResponse.json({
      published,
      skipped,
      message:
        published.length > 0
          ? `${published.length} bulletin(s) publié(s)`
          : "Aucune publication effectuée",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
