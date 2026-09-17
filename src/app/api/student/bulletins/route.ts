import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStudentFromRequest } from "@/lib/student-auth"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import { loadPrimaryBulletins } from "@/lib/grading/primary-bulletin"
import { bulletinEventKey } from "@/lib/grading/class-submission-status"
import { ensureDefaultEvaluationCycles } from "@/lib/grading/cycles"

/**
 * GET /api/student/bulletins?yearId=
 * Notes / bulletin publiés pour une année d'inscription de l'élève.
 */
export async function GET(req: NextRequest) {
  const ctx = await getStudentFromRequest(req)
  if (!ctx?.studentId || !ctx.schoolId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearIdParam = new URL(req.url).searchParams.get("yearId")
  const yearId = yearIdParam ? Number(yearIdParam) : null
  if (!yearId || !Number.isFinite(yearId)) {
    return NextResponse.json({ error: "yearId requis" }, { status: 400 })
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: ctx.studentId,
      yearId,
      class: { schoolId: ctx.schoolId },
      status: { in: ["ACTIVE", "GRADUATED", "CONFIRMEE", "INACTIVE"] },
    },
    include: {
      year: { select: { id: true, name: true } },
      class: {
        select: { id: true, name: true, section: true, level: true, letter: true },
      },
    },
  })

  if (!enrollment) {
    return NextResponse.json({ error: "Inscription introuvable pour cette année" }, { status: 404 })
  }

  const currentYearId = await getSchoolCurrentYearId(ctx.schoolId)
  const isCurrent = currentYearId != null && enrollment.yearId === currentYearId

  const base = {
    year: {
      id: enrollment.year.id,
      name: enrollment.year.name,
      isCurrent,
    },
    enrollment: {
      id: enrollment.id,
      classId: enrollment.classId,
      className: enrollment.class.name,
      section: enrollment.class.section,
      level: enrollment.class.level,
      letter: enrollment.class.letter,
    },
  }

  if (enrollment.class.section !== "Primaire") {
    return NextResponse.json({
      ...base,
      supported: false,
      message: "Les bulletins secondaires seront disponibles prochainement.",
      publications: [],
      bulletin: null,
      student: null,
    })
  }

  const [publications, cycles] = await Promise.all([
    prisma.bulletinPublication.findMany({
      where: { schoolId: ctx.schoolId, classId: enrollment.classId },
      orderBy: { publishedAt: "asc" },
      select: {
        id: true,
        kind: true,
        periodId: true,
        periodGroupId: true,
        eventKey: true,
        publishedAt: true,
      },
    }),
    ensureDefaultEvaluationCycles(ctx.schoolId),
  ])

  const primaryCycle = cycles.find((c) => c.kind === "PRIMARY")
  const periodNameById = new Map<number, string>()
  const groupNameById = new Map<number, string>()
  if (primaryCycle) {
    for (const g of primaryCycle.periodGroups) {
      groupNameById.set(g.id, g.name)
      for (const p of g.periods) {
        periodNameById.set(p.id, p.name)
      }
    }
  }

  const publicationItems = publications.map((p) => {
    let label = "Bulletin"
    if (p.kind === "PERIOD" && p.periodId) {
      label = periodNameById.get(p.periodId) || `Période ${p.periodId}`
    } else if (p.kind === "EXAM" && p.periodGroupId) {
      const gName = groupNameById.get(p.periodGroupId)
      label = gName ? `Examen — ${gName}` : "Examen"
    }
    return {
      id: p.id,
      kind: p.kind as "PERIOD" | "EXAM",
      periodId: p.periodId,
      periodGroupId: p.periodGroupId,
      eventKey: p.eventKey,
      label,
      publishedAt: p.publishedAt.toISOString(),
    }
  })

  if (publicationItems.length === 0) {
    return NextResponse.json({
      ...base,
      supported: true,
      message: "Aucun bulletin publié pour le moment. Les notes apparaîtront dès que l'école publiera les résultats.",
      publications: [],
      bulletin: null,
      student: null,
    })
  }

  // Focus = dernier événement publié (visibilité cumulative déjà gérée)
  const latest = publicationItems[publicationItems.length - 1]
  const focusKind = latest.kind
  const focusPeriodId = focusKind === "PERIOD" ? latest.periodId : null
  const focusPeriodGroupId = focusKind === "EXAM" ? latest.periodGroupId : null

  // Vérifier cohérence eventKey
  const expectedKey = bulletinEventKey(focusKind, focusPeriodId, focusPeriodGroupId)
  if (expectedKey !== latest.eventKey && publicationItems.length > 0) {
    // fallback: use stored ids as-is
  }

  try {
    const payload = await loadPrimaryBulletins({
      schoolId: ctx.schoolId,
      yearId: enrollment.yearId,
      classId: enrollment.classId,
      kind: focusKind,
      periodId: focusPeriodId,
      periodGroupId: focusPeriodGroupId,
      enrollmentId: enrollment.id,
    })

    const student = payload.students[0] ?? null

    return NextResponse.json({
      ...base,
      supported: true,
      message: null,
      publications: publicationItems,
      publishedThroughLabel: payload.visibility.publishedThroughLabel,
      focusEvent: payload.focusEvent,
      visibility: payload.visibility,
      trimestres: payload.trimestres,
      bulletin: student
        ? {
            lines: student.lines,
            domainSubtotals: student.domainSubtotals,
            summaries: student.summaries,
            conduiteByPeriod: student.conduiteByPeriod,
          }
        : null,
      student: student
        ? {
            enrollmentId: student.enrollmentId,
            code: student.code,
            fullName: student.fullName,
          }
        : null,
    })
  } catch (err) {
    console.error("[student/bulletins]", err)
    return NextResponse.json({
      ...base,
      supported: true,
      message: "Impossible de charger le bulletin pour le moment.",
      publications: publicationItems,
      bulletin: null,
      student: null,
    })
  }
}
