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
    const { subjectId, teacherId, classId, weeklyHours, yearId: yearIdBody } = body

    if (!subjectId || !teacherId || !classId) {
      return NextResponse.json({ error: "Matière, professeur et classe requis" }, { status: 400 })
    }

    const yearId = yearIdBody
      ? parseInt(yearIdBody)
      : await getSchoolCurrentYearId(user.schoolId)

    if (!yearId) {
      return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
    }

    const [subject, teacher, cls] = await Promise.all([
      prisma.subject.findFirst({ where: { id: parseInt(subjectId), schoolId: user.schoolId, isActive: true } }),
      prisma.teacher.findFirst({ where: { id: parseInt(teacherId), user: { schoolId: user.schoolId } } }),
      prisma.class.findFirst({ where: { id: parseInt(classId), schoolId: user.schoolId } }),
    ])

    if (!subject || !teacher || !cls) {
      return NextResponse.json({ error: "Matière, professeur ou classe invalide" }, { status: 400 })
    }

    const assignment = await prisma.courseAssignment.upsert({
      where: {
        subjectId_classId_yearId_schoolId: {
          subjectId: parseInt(subjectId),
          classId: parseInt(classId),
          yearId,
          schoolId: user.schoolId,
        },
      },
      create: {
        subjectId: parseInt(subjectId),
        teacherId: parseInt(teacherId),
        classId: parseInt(classId),
        yearId,
        weeklyHours: weeklyHours ? parseFloat(weeklyHours) : 2,
        schoolId: user.schoolId,
      },
      update: {
        teacherId: parseInt(teacherId),
        weeklyHours: weeklyHours ? parseFloat(weeklyHours) : 2,
        isActive: true,
      },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { lastName: true, middleName: true, firstName: true } },
        class: { select: { name: true } },
        year: { select: { name: true } },
      },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
