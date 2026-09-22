import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getParentFromRequest, assertParentChildLink } from "@/lib/parent-auth"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import { loadPrimaryBulletins } from "@/lib/grading/primary-bulletin"
import { bulletinEventKey } from "@/lib/grading/class-submission-status"
import { ensureDefaultEvaluationCycles } from "@/lib/grading/cycles"

/**
 * GET /api/parent/children/[studentId]/bulletins?yearId=&kind=&periodId=&periodGroupId=&full=
 * Bulletin publié d'un enfant lié (mêmes règles que l'espace élève).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const ctx = await getParentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const studentId = parseInt((await params).studentId, 10)
  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const link = await assertParentChildLink(ctx.parentId, studentId)
  if (!link) {
    return NextResponse.json({ error: "Élève non lié à ce compte" }, { status: 403 })
  }

  const searchParams = new URL(req.url).searchParams
  const yearIdParam = searchParams.get("yearId")
  const yearId = yearIdParam ? Number(yearIdParam) : null
  if (!yearId || !Number.isFinite(yearId)) {
    return NextResponse.json({ error: "yearId requis" }, { status: 400 })
  }

  const focusKindRaw = (searchParams.get("kind") || "").toUpperCase()
  const focusPeriodIdRaw = searchParams.get("periodId")
  const focusPeriodGroupIdRaw = searchParams.get("periodGroupId")
  const wantFull = searchParams.get("full") === "1"

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      yearId,
      class: { schoolId: ctx.schoolId },
      status: { in: ["ACTIVE", "GRADUATED", "CONFIRMEE", "INACTIVE", "PROPOSEE"] },
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

  if (
    enrollment.class.section !== "Primaire" &&
    enrollment.class.section !== "Education de Base"
  ) {
    return NextResponse.json({
      ...base,
      supported: false,
      message: "Les bulletins Humanités seront disponibles prochainement.",
      publications: [],
      bulletin: null,
      student: null,
    })
  }

  const isPrimary = enrollment.class.section === "Primaire"
  const cycleKind = isPrimary ? "PRIMARY" : "SECONDARY"

  const [publications, cycles] = await Promise.all([
    prisma.bulletinPublication.findMany({
      where: {
        schoolId: ctx.schoolId,
        classId: enrollment.classId,
        yearId: enrollment.yearId,
      },
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

  const evalCycle = cycles.find((c) => c.kind === cycleKind)
  const periodNameById = new Map<number, string>()
  const groupNameById = new Map<number, string>()
  const periodToGroupId = new Map<number, number>()
  if (evalCycle) {
    for (const g of evalCycle.periodGroups) {
      groupNameById.set(g.id, g.name)
      for (const p of g.periods) {
        periodNameById.set(p.id, p.name)
        periodToGroupId.set(p.id, g.id)
      }
    }
  }

  const publicationItems = publications.map((p) => {
    let label = "Bulletin"
    let groupId: number | null = null
    let groupName: string | null = null
    if (p.kind === "PERIOD" && p.periodId) {
      label = periodNameById.get(p.periodId) || `Période ${p.periodId}`
      groupId = periodToGroupId.get(p.periodId) ?? null
      groupName = groupId != null ? groupNameById.get(groupId) || null : null
    } else if (p.kind === "EXAM" && p.periodGroupId) {
      const gName = groupNameById.get(p.periodGroupId)
      label = gName ? `Examen — ${gName}` : "Examen"
      groupId = p.periodGroupId
      groupName = gName || null
    }
    return {
      id: p.id,
      kind: p.kind as "PERIOD" | "EXAM",
      periodId: p.periodId,
      periodGroupId: p.periodGroupId,
      eventKey: p.eventKey,
      label,
      groupId,
      groupName,
      publishedAt: p.publishedAt.toISOString(),
    }
  })

  if (publicationItems.length === 0) {
    return NextResponse.json({
      ...base,
      supported: true,
      message:
        "Aucun bulletin publié pour le moment. Les notes apparaîtront dès que l'école publiera les résultats.",
      publications: [],
      bulletin: null,
      student: null,
      payload: null,
    })
  }

  let latest = publicationItems[publicationItems.length - 1]
  if (focusKindRaw === "PERIOD" || focusKindRaw === "EXAM") {
    const periodId = focusPeriodIdRaw ? Number(focusPeriodIdRaw) : null
    const periodGroupId = focusPeriodGroupIdRaw
      ? Number(focusPeriodGroupIdRaw)
      : null
    const requestedKey = bulletinEventKey(
      focusKindRaw,
      focusKindRaw === "PERIOD" ? periodId : null,
      focusKindRaw === "EXAM" ? periodGroupId : null
    )
    const found = publicationItems.find((p) => p.eventKey === requestedKey)
    if (!found) {
      return NextResponse.json(
        { error: "Cet événement n'est pas encore publié pour la classe de cet élève" },
        { status: 403 }
      )
    }
    latest = found
  }

  const focusKind = latest.kind
  const focusPeriodId = focusKind === "PERIOD" ? latest.periodId : null
  const focusPeriodGroupId = focusKind === "EXAM" ? latest.periodGroupId : null

  try {
    if (isPrimary) {
      const payload = await loadPrimaryBulletins({
        schoolId: ctx.schoolId,
        yearId: enrollment.yearId,
        classId: enrollment.classId,
        kind: focusKind,
        periodId: focusPeriodId,
        periodGroupId: focusPeriodGroupId,
        enrollmentId: enrollment.id,
        audience: "student",
      })

      const student = payload.students[0] ?? null

      return NextResponse.json({
        ...base,
        supported: true,
        cycle: "PRIMARY",
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
        ...(wantFull ? { payload } : {}),
      })
    }

    const { loadSecondaryBulletins } = await import(
      "@/lib/grading/secondary-bulletin"
    )
    const payload = await loadSecondaryBulletins({
      schoolId: ctx.schoolId,
      yearId: enrollment.yearId,
      classId: enrollment.classId,
      kind: focusKind,
      periodId: focusPeriodId,
      periodGroupId: focusPeriodGroupId,
      enrollmentId: enrollment.id,
      audience: "student",
    })

    const student = payload.students[0] ?? null

    return NextResponse.json({
      ...base,
      supported: true,
      cycle: "SECONDARY",
      message: null,
      publications: publicationItems,
      publishedThroughLabel: payload.visibility.publishedThroughLabel,
      focusEvent: payload.focusEvent,
      visibility: payload.visibility,
      trimestres: payload.semestres,
      semestres: payload.semestres,
      bulletin: student
        ? {
            lines: student.lines.map((l) => ({
              subjectId: l.subjectId,
              name: l.name,
              domainName: l.domainName,
              groupName: l.groupName,
              maxPeriode: l.maxPeriode,
              maxExamen: l.maxExamen,
              maxTrimestre: l.maxSemestre,
              maxSemestre: l.maxSemestre,
              maxAnnuel: l.maxAnnuel,
              periodScores: l.periodScores,
              examScores: l.examScores,
              trimScores: l.semestreScores,
              semestreScores: l.semestreScores,
              annualScore: l.annualScore,
              repechagePercent: l.repechagePercent,
            })),
            domainSubtotals: student.domainSubtotals.map((d) => ({
              domainName: d.domainName,
              maxPeriode: d.maxPeriode,
              maxExamen: d.maxExamen,
              maxTrimestre: d.maxSemestre,
              maxSemestre: d.maxSemestre,
              maxAnnuel: d.maxAnnuel,
              periodScores: d.periodScores,
              examScores: d.examScores,
              trimScores: d.semestreScores,
              semestreScores: d.semestreScores,
              annualScore: d.annualScore,
            })),
            summaries: student.summaries,
            conduiteByPeriod: student.conduiteByPeriod,
            repechageSubjects: student.repechageSubjects,
          }
        : null,
      student: student
        ? {
            enrollmentId: student.enrollmentId,
            code: student.code,
            fullName: student.fullName,
          }
        : null,
      ...(wantFull ? { payload } : {}),
    })
  } catch (err) {
    console.error("[parent/children/bulletins]", err)
    return NextResponse.json({
      ...base,
      supported: true,
      message: "Impossible de charger le bulletin pour le moment.",
      publications: publicationItems,
      bulletin: null,
      student: null,
      payload: null,
    })
  }
}
