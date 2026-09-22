import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTeacherFromRequest } from "@/lib/teacher-auth"

/**
 * GET ?assignmentId=
 * Liste des % de repêchage pour ce cours (année courante).
 *
 * PUT { assignmentId, grades: [{ enrollmentId, percentage | null }] }
 * Upsert / suppression des notes de repêchage.
 */
export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!ctx.yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const assignmentId = parseInt(
    new URL(req.url).searchParams.get("assignmentId") || "",
    10
  )
  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId requis" }, { status: 400 })
  }

  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      id: assignmentId,
      teacherId: ctx.teacherId,
      schoolId: ctx.schoolId,
      yearId: ctx.yearId,
      isActive: true,
    },
    include: {
      class: { select: { section: true } },
    },
  })
  if (!assignment) {
    return NextResponse.json({ error: "Cours non assigné" }, { status: 404 })
  }
  if (assignment.class.section !== "Education de Base") {
    return NextResponse.json(
      { error: "Le repêchage concerne uniquement l'Éducation de Base" },
      { status: 400 }
    )
  }

  const rows = await prisma.repechageGrade.findMany({
    where: {
      courseAssignmentId: assignmentId,
      yearId: ctx.yearId,
    },
    select: { enrollmentId: true, percentage: true },
  })

  return NextResponse.json({
    byEnrollment: Object.fromEntries(
      rows.map((r) => [String(r.enrollmentId), r.percentage])
    ),
  })
}

export async function PUT(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!ctx.yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const assignmentId = parseInt(String(body.assignmentId || ""), 10)
  const grades = Array.isArray(body.grades) ? body.grades : null

  if (!assignmentId || !grades) {
    return NextResponse.json(
      { error: "assignmentId et grades requis" },
      { status: 400 }
    )
  }

  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      id: assignmentId,
      teacherId: ctx.teacherId,
      schoolId: ctx.schoolId,
      yearId: ctx.yearId,
      isActive: true,
    },
    include: {
      class: { select: { id: true, section: true } },
    },
  })
  if (!assignment) {
    return NextResponse.json({ error: "Cours non assigné" }, { status: 404 })
  }
  if (assignment.class.section !== "Education de Base") {
    return NextResponse.json(
      { error: "Le repêchage concerne uniquement l'Éducation de Base" },
      { status: 400 }
    )
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: assignment.classId,
      yearId: ctx.yearId,
      status: "ACTIVE",
    },
    select: { id: true },
  })
  const allowed = new Set(enrollments.map((e) => e.id))

  let saved = 0
  let cleared = 0

  for (const row of grades) {
    const enrollmentId = parseInt(String(row.enrollmentId || ""), 10)
    if (!allowed.has(enrollmentId)) continue

    const raw = row.percentage
    const clear =
      raw === null ||
      raw === undefined ||
      raw === "" ||
      (typeof raw === "string" && !raw.trim())

    if (clear) {
      const del = await prisma.repechageGrade.deleteMany({
        where: {
          enrollmentId,
          subjectId: assignment.subjectId,
          yearId: ctx.yearId,
        },
      })
      cleared += del.count
      continue
    }

    const percentage = Number(raw)
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: `Pourcentage invalide pour l'élève ${enrollmentId} (0–100)` },
        { status: 400 }
      )
    }

    await prisma.repechageGrade.upsert({
      where: {
        enrollmentId_subjectId_yearId: {
          enrollmentId,
          subjectId: assignment.subjectId,
          yearId: ctx.yearId,
        },
      },
      create: {
        enrollmentId,
        subjectId: assignment.subjectId,
        courseAssignmentId: assignmentId,
        yearId: ctx.yearId,
        percentage,
      },
      update: {
        percentage,
        courseAssignmentId: assignmentId,
      },
    })
    saved++
  }

  return NextResponse.json({ ok: true, saved, cleared })
}
