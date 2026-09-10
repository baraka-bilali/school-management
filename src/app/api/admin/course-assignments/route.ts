import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError, getSchoolCurrentYearId } from "@/lib/fees/api-helpers"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")
    const classId = searchParams.get("classId")
    const yearIdParam = searchParams.get("yearId")

    const yearId = yearIdParam
      ? parseInt(yearIdParam)
      : await getSchoolCurrentYearId(user.schoolId)

    const assignments = await prisma.courseAssignment.findMany({
      where: {
        schoolId: user.schoolId,
        isActive: true,
        ...(yearId ? { yearId } : {}),
        ...(teacherId ? { teacherId: parseInt(teacherId) } : {}),
        ...(classId ? { classId: parseInt(classId) } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
        teacher: { select: { id: true, lastName: true, middleName: true, firstName: true } },
        class: { select: { id: true, name: true } },
        year: { select: { id: true, name: true } },
      },
      orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
    })

    const data = assignments.map((a) => ({
      id: a.id,
      subjectId: a.subjectId,
      teacherId: a.teacherId,
      classId: a.classId,
      yearId: a.yearId,
      weeklyHours: a.weeklyHours,
      subjectName: a.subject.name,
      subjectCode: a.subject.code,
      subjectColor: a.subject.color,
      teacherName: `${a.teacher.lastName} ${a.teacher.middleName || ""} ${a.teacher.firstName}`.replace(/\s+/g, " ").trim(),
      className: a.class.name,
      yearName: a.year.name,
    }))

    return NextResponse.json({ assignments: data, yearId })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const body = await req.json()
    const { subjectId, teacherId, classId, classIds, weeklyHours, yearId: yearIdBody } = body

    const parsedClassIds: number[] = Array.isArray(classIds)
      ? classIds.map((id: unknown) => parseInt(String(id), 10)).filter((id: number) => Number.isFinite(id) && id > 0)
      : classId
        ? [parseInt(String(classId), 10)].filter((id) => Number.isFinite(id) && id > 0)
        : []

    const uniqueClassIds = [...new Set(parsedClassIds)]

    if (!subjectId || !teacherId || uniqueClassIds.length === 0) {
      return NextResponse.json(
        { error: "Matière, professeur et au moins une classe requis" },
        { status: 400 }
      )
    }

    const yearId = yearIdBody
      ? parseInt(yearIdBody)
      : await getSchoolCurrentYearId(user.schoolId)

    if (!yearId) {
      return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
    }

    const subjectIdNum = parseInt(subjectId, 10)
    const teacherIdNum = parseInt(teacherId, 10)
    const hours = weeklyHours ? parseFloat(weeklyHours) : 2

    const [subject, teacher, classRows] = await Promise.all([
      prisma.subject.findFirst({
        where: { id: subjectIdNum, schoolId: user.schoolId, isActive: true },
      }),
      prisma.teacher.findFirst({
        where: { id: teacherIdNum, user: { schoolId: user.schoolId } },
      }),
      prisma.class.findMany({
        where: { id: { in: uniqueClassIds }, schoolId: user.schoolId },
        select: { id: true, name: true },
      }),
    ])

    if (!subject || !teacher) {
      return NextResponse.json({ error: "Matière ou professeur invalide" }, { status: 400 })
    }
    if (classRows.length !== uniqueClassIds.length) {
      return NextResponse.json({ error: "Une ou plusieurs classes sont invalides" }, { status: 400 })
    }

    const assignments = await prisma.$transaction(
      uniqueClassIds.map((cid) =>
        prisma.courseAssignment.upsert({
          where: {
            subjectId_classId_yearId_schoolId: {
              subjectId: subjectIdNum,
              classId: cid,
              yearId,
              schoolId: user.schoolId,
            },
          },
          create: {
            subjectId: subjectIdNum,
            teacherId: teacherIdNum,
            classId: cid,
            yearId,
            weeklyHours: hours,
            schoolId: user.schoolId,
          },
          update: {
            teacherId: teacherIdNum,
            weeklyHours: hours,
            isActive: true,
          },
          include: {
            subject: { select: { name: true, code: true } },
            teacher: { select: { lastName: true, middleName: true, firstName: true } },
            class: { select: { name: true } },
            year: { select: { name: true } },
          },
        })
      )
    )

    return NextResponse.json(
      {
        assignments,
        assignment: assignments[0],
        count: assignments.length,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
