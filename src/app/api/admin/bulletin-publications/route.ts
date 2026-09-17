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
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { ensureDefaultEvaluationCycles } from "@/lib/grading/cycles"

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

    const published: Array<{
      classId: number
      publicationId: number
      kind: "PERIOD" | "EXAM"
      periodId: number | null
      periodGroupId: number | null
      eventKey: string
    }> = []
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
        published.push({
          classId: item.classId,
          publicationId: row.id,
          kind: item.kind,
          periodId: item.periodId ?? null,
          periodGroupId: item.periodGroupId ?? null,
          eventKey,
        })
      }
    }

    // Notifications + broadcast Supabase pour les élèves des classes publiées
    if (published.length > 0 && yearId) {
      try {
        const cycles = await ensureDefaultEvaluationCycles(schoolId)
        const primaryCycle = cycles.find((c) => c.kind === "PRIMARY")
        const periodNameById = new Map<number, string>()
        const groupNameById = new Map<number, string>()
        if (primaryCycle) {
          for (const g of primaryCycle.periodGroups) {
            groupNameById.set(g.id, g.name)
            for (const p of g.periods) periodNameById.set(p.id, p.name)
          }
        }

        const classIds = [...new Set(published.map((p) => p.classId))]
        const classes = await prisma.class.findMany({
          where: { id: { in: classIds }, schoolId },
          select: { id: true, name: true },
        })
        const classNameById = new Map(classes.map((c) => [c.id, c.name]))

        const enrollments = await prisma.enrollment.findMany({
          where: {
            classId: { in: classIds },
            yearId,
            status: "ACTIVE",
          },
          select: {
            classId: true,
            student: { select: { id: true, userId: true } },
          },
        })

        const studentsByClass = new Map<number, { studentId: number; userId: number }[]>()
        for (const enr of enrollments) {
          if (!enr.student.userId) continue
          const list = studentsByClass.get(enr.classId) || []
          list.push({ studentId: enr.student.id, userId: enr.student.userId })
          studentsByClass.set(enr.classId, list)
        }

        const notifRows: {
          type: "SYSTEM_MESSAGE"
          message: string
          userId: number
          schoolId: number
          targetRole: "ALL"
        }[] = []

        for (const pub of published) {
          let eventLabel = "Bulletin"
          if (pub.kind === "PERIOD" && pub.periodId) {
            eventLabel = periodNameById.get(pub.periodId) || "Période"
          } else if (pub.kind === "EXAM" && pub.periodGroupId) {
            const g = groupNameById.get(pub.periodGroupId)
            eventLabel = g ? `Examen — ${g}` : "Examen"
          }
          const className = classNameById.get(pub.classId) || "votre classe"
          const message = `Bulletin publié : ${eventLabel} (${className}). Consultez vos notes.`
          const students = studentsByClass.get(pub.classId) || []
          for (const s of students) {
            notifRows.push({
              type: "SYSTEM_MESSAGE",
              message,
              userId: s.userId,
              schoolId,
              targetRole: "ALL",
            })
          }

          try {
            await getSupabaseAdmin()
              .channel(`bulletins:class:${pub.classId}`)
              .send({
                type: "broadcast",
                event: "bulletin_published",
                payload: {
                  classId: pub.classId,
                  eventKey: pub.eventKey,
                  label: eventLabel,
                  className,
                  yearId,
                },
              })
          } catch (broadcastErr) {
            console.error("[bulletin-publications] broadcast", broadcastErr)
          }
        }

        if (notifRows.length > 0) {
          // createMany par lots pour éviter des payloads trop gros
          const CHUNK = 200
          for (let i = 0; i < notifRows.length; i += CHUNK) {
            await prisma.notification.createMany({
              data: notifRows.slice(i, i + CHUNK),
            })
          }
        }
      } catch (notifyErr) {
        console.error("[bulletin-publications] notify students", notifyErr)
      }
    }

    return NextResponse.json({
      published: published.map(({ classId, publicationId }) => ({ classId, publicationId })),
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
