import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/**
 * GET ?subjectId=&section=&level=
 * Retourne les maxima période + examen pour un degré donné.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const { searchParams } = new URL(req.url)
    const subjectId = parseInt(searchParams.get("subjectId") || "", 10)
    const section = searchParams.get("section") || ""
    const level = searchParams.get("level") || ""

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

    const [periodMaxima, examMaxima, degrees] = await Promise.all([
      prisma.subjectPeriodMax.findMany({
        where: { schoolId: user.schoolId, subjectId, section, level },
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
        where: { schoolId: user.schoolId, subjectId, section, level },
        include: {
          periodGroup: { select: { id: true, name: true, sortOrder: true, hasExam: true } },
        },
      }),
      prisma.class.findMany({
        where: { schoolId: user.schoolId },
        select: { section: true, level: true },
        distinct: ["section", "level"],
        orderBy: [{ section: "asc" }, { level: "asc" }],
      }),
    ])

    return NextResponse.json({
      subject,
      section,
      level,
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
      degrees,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT body: {
 *   subjectId, section, level,
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
    const periodMaxima = Array.isArray(body.periodMaxima) ? body.periodMaxima : []
    const examMaxima = Array.isArray(body.examMaxima) ? body.examMaxima : []

    if (!subjectId || !section || !level) {
      return NextResponse.json(
        { error: "subjectId, section et level requis" },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: user.schoolId, isActive: true },
    })
    if (!subject) {
      return NextResponse.json({ error: "Matière introuvable" }, { status: 404 })
    }

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
            subjectId_section_level_periodId: {
              subjectId,
              section,
              level,
              periodId,
            },
          },
          create: {
            subjectId,
            section,
            level,
            periodId,
            schoolId: user.schoolId,
            maxPoints,
          },
          update: { maxPoints },
        })
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
            subjectId_section_level_periodGroupId: {
              subjectId,
              section,
              level,
              periodGroupId,
            },
          },
          create: {
            subjectId,
            section,
            level,
            periodGroupId,
            schoolId: user.schoolId,
            maxPoints,
          },
          update: { maxPoints },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
