import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { teacherHasClassAccess } from "@/lib/teacher-classes"
import { loadPrimaryBulletins } from "@/lib/grading/primary-bulletin"
import { prisma } from "@/lib/prisma"

/**
 * GET ?classId=&enrollmentId=&kind=PERIOD|EXAM&periodId=&periodGroupId=
 * Bulletin d'un élève pour l'enseignant (aperçu PDF côté client).
 */
export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!ctx.yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const classId = parseInt(searchParams.get("classId") || "", 10)
  const enrollmentId = parseInt(searchParams.get("enrollmentId") || "", 10)
  const kind = searchParams.get("kind") === "EXAM" ? "EXAM" : "PERIOD"
  const periodId = searchParams.get("periodId")
    ? parseInt(searchParams.get("periodId")!, 10)
    : null
  const periodGroupId = searchParams.get("periodGroupId")
    ? parseInt(searchParams.get("periodGroupId")!, 10)
    : null

  if (!classId || !enrollmentId) {
    return NextResponse.json(
      { error: "classId et enrollmentId requis" },
      { status: 400 }
    )
  }

  const allowed = await teacherHasClassAccess(
    ctx.teacherId,
    ctx.schoolId,
    ctx.yearId,
    classId
  )
  if (!allowed) {
    return NextResponse.json({ error: "Classe non assignée" }, { status: 403 })
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      classId,
      yearId: ctx.yearId,
      status: "ACTIVE",
    },
  })
  if (!enrollment) {
    return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
  }

  let focusKind: "PERIOD" | "EXAM" = kind === "EXAM" ? "EXAM" : "PERIOD"
  let focusPeriodId = periodId
  let focusPeriodGroupId = periodGroupId

  if (!focusPeriodId && !focusPeriodGroupId) {
    const cycle = await prisma.evaluationCycle.findFirst({
      where: { schoolId: ctx.schoolId, kind: "PRIMARY" },
      include: {
        periodGroups: {
          orderBy: { sortOrder: "asc" },
          include: { periods: { orderBy: { sortOrder: "asc" } } },
        },
      },
    })
    const firstPeriod = cycle?.periodGroups[0]?.periods[0]
    if (firstPeriod) {
      focusKind = "PERIOD"
      focusPeriodId = firstPeriod.id
      focusPeriodGroupId = cycle!.periodGroups[0].id
    }
  }

  if (focusKind === "PERIOD" && !focusPeriodId) {
    return NextResponse.json({ error: "periodId requis" }, { status: 400 })
  }
  if (focusKind === "EXAM" && !focusPeriodGroupId) {
    return NextResponse.json({ error: "periodGroupId requis" }, { status: 400 })
  }

  try {
    const data = await loadPrimaryBulletins({
      schoolId: ctx.schoolId,
      yearId: ctx.yearId,
      classId,
      kind: focusKind,
      periodId: focusKind === "PERIOD" ? focusPeriodId : null,
      periodGroupId:
        focusKind === "EXAM"
          ? focusPeriodGroupId
          : focusPeriodGroupId,
      enrollmentId,
    })
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bulletin indisponible" },
      { status: 400 }
    )
  }
}
