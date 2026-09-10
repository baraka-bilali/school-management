import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { normalizeGradeStream } from "@/lib/grading/degree"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/**
 * GET ?subjectId=&section=&level=&stream=
 * Retourne les maxima période + examen pour un degré (+ filière Humanités).
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const { searchParams } = new URL(req.url)
    const subjectId = parseInt(searchParams.get("subjectId") || "", 10)
    const section = searchParams.get("section") || ""
    const level = searchParams.get("level") || ""
    const stream =
      section === "Humanités"
        ? normalizeGradeStream(searchParams.get("stream"))
        : ""

    if (!subjectId || !section || !level) {
      return NextResponse.json(
        { error: "subjectId, section et level requis" },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: user.schoolId, isActive: true },
      select: { id: true, name: true, code: true },
    })
    if (!subject) {
      return NextResponse.json({ error: "Matière introuvable" }, { status: 404 })
    }

    const [periodMaxima, examMaxima] = await Promise.all([
      prisma.subjectPeriodMax.findMany({
        where: { schoolId: user.schoolId, subjectId, section, level, stream },
        include: {
          period: {
            select: {
              id: true,
              name: true,
              sortOrder: true,
              periodGroupId: true,
              periodGroup: { select: { id: true, name: true, sortOrder: true } },
            },
          },
        },
      }),
      prisma.subjectExamMax.findMany({
        where: { schoolId: user.schoolId, subjectId, section, level, stream },
        include: {
          periodGroup: { select: { id: true, name: true, sortOrder: true, hasExam: true } },
        },
      }),
    ])

    return NextResponse.json({
      subject,
      section,
      level,
      stream,
      periodMaxima: periodMaxima.map((m) => ({
        id: m.id,
        periodId: m.periodId,
        maxPoints: m.maxPoints,
        periodName: m.period.name,
        periodGroupId: m.period.periodGroupId,
        periodGroupName: m.period.periodGroup.name,
      })),
      examMaxima: examMaxima.map((m) => ({
        id: m.id,
        periodGroupId: m.periodGroupId,
        maxPoints: m.maxPoints,
        periodGroupName: m.periodGroup.name,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT body: {
 *   subjectId, section, level, stream?,
 *   periodMaxima: [{ periodId, maxPoints }],
 *   examMaxima: [{ periodGroupId, maxPoints }]
 * }
 */
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const body = await req.json()
    const subjectId = parseInt(body.subjectId, 10)
    const section = String(body.section || "").trim()
    const level = String(body.level || "").trim()
    const stream =
      section === "Humanités" ? normalizeGradeStream(body.stream) : ""
    const periodMaxima = Array.isArray(body.periodMaxima) ? body.periodMaxima : []
    const examMaxima = Array.isArray(body.examMaxima) ? body.examMaxima : []

    if (!subjectId || !section || !level) {
      return NextResponse.json(
        { error: "subjectId, section et level requis" },
        { status: 400 }
      )
    }
    if (section === "Humanités" && !stream) {
      return NextResponse.json(
        { error: "La filière (stream) est requise pour les Humanités" },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: user.schoolId, isActive: true },
    })
    if (!subject) {
      return NextResponse.json({ error: "Matière introuvable" }, { status: 404 })
    }

    let savedPeriods = 0
    let savedExams = 0

    await prisma.$transaction(async (tx) => {
      for (const row of periodMaxima) {
        const periodId = parseInt(row.periodId, 10)
        const maxPoints = Number(row.maxPoints)
        if (!periodId || !Number.isFinite(maxPoints) || maxPoints < 0) continue

        const period = await tx.period.findFirst({
          where: {
            id: periodId,
            periodGroup: { cycle: { schoolId: user.schoolId } },
          },
        })
        if (!period) continue

        await tx.subjectPeriodMax.upsert({
          where: {
            subjectId_section_level_stream_periodId: {
              subjectId,
              section,
              level,
              stream,
              periodId,
            },
          },
          create: {
            subjectId,
            section,
            level,
            stream,
            periodId,
            schoolId: user.schoolId,
            maxPoints,
          },
          update: { maxPoints },
        })
        savedPeriods += 1
      }

      for (const row of examMaxima) {
        const periodGroupId = parseInt(row.periodGroupId, 10)
        const maxPoints = Number(row.maxPoints)
        if (!periodGroupId || !Number.isFinite(maxPoints) || maxPoints < 0) continue

        const group = await tx.periodGroup.findFirst({
          where: { id: periodGroupId, cycle: { schoolId: user.schoolId } },
        })
        if (!group) continue

        await tx.subjectExamMax.upsert({
          where: {
            subjectId_section_level_stream_periodGroupId: {
              subjectId,
              section,
              level,
              stream,
              periodGroupId,
            },
          },
          create: {
            subjectId,
            section,
            level,
            stream,
            periodGroupId,
            schoolId: user.schoolId,
            maxPoints,
          },
          update: { maxPoints },
        })
        savedExams += 1
      }
    })

    return NextResponse.json({
      ok: true,
      savedPeriods,
      savedExams,
      message: "Maxima enregistrés",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
