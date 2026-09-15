import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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
 * GET /api/admin/grades-overview
 * School-wide (focus Primaire) stats for the Notes & Bulletins banner.
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
    const defaultEvent = events[0] || null

    const { searchParams } = new URL(req.url)
    const kindParam = (searchParams.get("kind") || defaultEvent?.kind || "PERIOD") as
      | "PERIOD"
      | "EXAM"
    const periodId = searchParams.get("periodId")
      ? parseInt(searchParams.get("periodId")!, 10)
      : defaultEvent?.periodId ?? null
    const periodGroupId = searchParams.get("periodGroupId")
      ? parseInt(searchParams.get("periodGroupId")!, 10)
      : defaultEvent?.periodGroupId ?? null

    const kind: "PERIOD" | "EXAM" =
      kindParam === "EXAM" || (periodGroupId && !periodId) ? "EXAM" : "PERIOD"

    const primaryClasses = await loadPrimaryClassResults({
      schoolId,
      yearId,
      kind: kind === "EXAM" ? "EXAM" : "PERIOD",
      periodId: kind === "PERIOD" ? periodId : null,
      periodGroupId: kind === "EXAM" ? periodGroupId : null,
    })

    const submittedCount = primaryClasses.filter((c) => c.status === "soumis").length
    const partialCount = primaryClasses.filter((c) => c.status === "partiel").length
    const pendingCount = primaryClasses.filter((c) => c.status === "en_attente").length

    // Best student / class / pass rate from available period grades (provisional).
    let bestStudent: {
      name: string
      className: string
      averagePercent: number
    } | null = null
    let bestClass: {
      classId: number
      name: string
      averagePercent: number
    } | null = null
    let globalPassRate: number | null = null

    if (yearId && kind === "PERIOD" && periodId) {
      const gradeRows = await prisma.grade.findMany({
        where: {
          enrollment: {
            yearId,
            status: "ACTIVE",
            class: { schoolId, section: "Primaire" },
          },
          column: { periodId },
        },
        select: {
          pointsObtained: true,
          column: { select: { maxPoints: true } },
          enrollment: {
            select: {
              id: true,
              classId: true,
              class: { select: { id: true, name: true } },
              student: {
                select: { lastName: true, middleName: true, firstName: true },
              },
            },
          },
        },
      })

      type Acc = {
        sumRatio: number
        count: number
        classId: number
        className: string
        studentName: string
      }
      const byEnrollment = new Map<number, Acc>()

      for (const row of gradeRows) {
        const max = row.column.maxPoints
        if (!max || max <= 0) continue
        const enr = row.enrollment
        const name = [enr.student.lastName, enr.student.middleName, enr.student.firstName]
          .filter(Boolean)
          .join(" ")
        let acc = byEnrollment.get(enr.id)
        if (!acc) {
          acc = {
            sumRatio: 0,
            count: 0,
            classId: enr.classId,
            className: enr.class.name,
            studentName: name,
          }
          byEnrollment.set(enr.id, acc)
        }
        acc.sumRatio += row.pointsObtained / max
        acc.count += 1
      }

      const studentAvgs: Array<{
        name: string
        className: string
        classId: number
        averagePercent: number
      }> = []
      for (const acc of byEnrollment.values()) {
        if (acc.count === 0) continue
        studentAvgs.push({
          name: acc.studentName,
          className: acc.className,
          classId: acc.classId,
          averagePercent: (acc.sumRatio / acc.count) * 100,
        })
      }

      if (studentAvgs.length > 0) {
        studentAvgs.sort((a, b) => b.averagePercent - a.averagePercent)
        const top = studentAvgs[0]
        bestStudent = {
          name: top.name,
          className: top.className,
          averagePercent: Math.round(top.averagePercent * 10) / 10,
        }

        const passed = studentAvgs.filter((s) => s.averagePercent >= 50).length
        globalPassRate = Math.round((passed / studentAvgs.length) * 1000) / 10

        const byClass = new Map<number, { name: string; sum: number; n: number }>()
        for (const s of studentAvgs) {
          let c = byClass.get(s.classId)
          if (!c) {
            c = { name: s.className, sum: 0, n: 0 }
            byClass.set(s.classId, c)
          }
          c.sum += s.averagePercent
          c.n += 1
        }
        let topClass: { classId: number; name: string; averagePercent: number } | null = null
        for (const [classId, c] of byClass) {
          if (c.n === 0) continue
          const avg = c.sum / c.n
          if (!topClass || avg > topClass.averagePercent) {
            topClass = {
              classId,
              name: c.name,
              averagePercent: Math.round(avg * 10) / 10,
            }
          }
        }
        bestClass = topClass
      }
    }

    const allClassCount = await prisma.class.count({ where: { schoolId } })
    const primaryClassCount = primaryClasses.length

    return NextResponse.json({
      section: "Primaire",
      event: defaultEvent
        ? {
            kind,
            periodId: kind === "PERIOD" ? periodId : null,
            periodGroupId: kind === "EXAM" ? periodGroupId : null,
            label:
              events.find(
                (e) =>
                  e.kind === kind &&
                  (kind === "PERIOD"
                    ? e.periodId === periodId
                    : e.periodGroupId === periodGroupId)
              )?.label || defaultEvent.label,
          }
        : null,
      submissionRuleNote:
        "Statut provisoire basé sur les verrous GradeEntryLock par branche pour l'événement sélectionné.",
      primaire: {
        classCount: primaryClassCount,
        submittedCount,
        partialCount,
        pendingCount,
        bestStudent,
        bestClass,
        globalPassRate,
      },
      school: {
        classCount: allClassCount,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
