import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError, getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import { compareClasses } from "@/lib/class-sort"
import { purgeNonCatalogSubjects } from "@/lib/grading/bulletin-subjects"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

/** Affectations catalogue bulletin : EB (CTEB) pour l’instant. Humanités à venir. */
const ASSIGNMENT_SECTIONS = ["Education de Base"] as const

function teacherDisplayName(t: {
  lastName: string
  middleName: string
  firstName: string
}) {
  return `${t.lastName} ${t.middleName || ""} ${t.firstName}`.replace(/\s+/g, " ").trim()
}

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    // Retire les matières libres (MATH, CHIMIE, etc.) et leurs affectations
    await purgeNonCatalogSubjects(user.schoolId)

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")
    const classId = searchParams.get("classId")
    const yearIdParam = searchParams.get("yearId")
    const sort = searchParams.get("sort") === "teacher" ? "teacher" : "level"

    const yearId = yearIdParam
      ? parseInt(yearIdParam)
      : await getSchoolCurrentYearId(user.schoolId)

    const assignments = await prisma.courseAssignment.findMany({
      where: {
        schoolId: user.schoolId,
        isActive: true,
        subject: {
          isActive: true,
          code: { startsWith: "CTEB-" },
        },
        class: {
          section: { in: [...ASSIGNMENT_SECTIONS] },
        },
        ...(yearId ? { yearId } : {}),
        ...(teacherId ? { teacherId: parseInt(teacherId) } : {}),
        ...(classId ? { classId: parseInt(classId) } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
        teacher: {
          select: { id: true, lastName: true, middleName: true, firstName: true },
        },
        class: {
          select: { id: true, name: true, section: true, level: true, letter: true },
        },
        year: { select: { id: true, name: true } },
      },
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
      teacherName: teacherDisplayName(a.teacher),
      teacherLastName: a.teacher.lastName,
      teacherFirstName: a.teacher.firstName,
      className: a.class.name,
      classSection: a.class.section,
      classLevel: a.class.level,
      classLetter: a.class.letter,
      yearName: a.year.name,
    }))

    data.sort((a, b) => {
      if (sort === "teacher") {
        const byTeacher = a.teacherName.localeCompare(b.teacherName, "fr", {
          sensitivity: "base",
        })
        if (byTeacher !== 0) return byTeacher
        const byClass = compareClasses(
          { section: a.classSection, level: a.classLevel, letter: a.classLetter },
          { section: b.classSection, level: b.classLevel, letter: b.classLetter }
        )
        if (byClass !== 0) return byClass
        return a.subjectName.localeCompare(b.subjectName, "fr", { sensitivity: "base" })
      }

      const byClass = compareClasses(
        { section: a.classSection, level: a.classLevel, letter: a.classLetter },
        { section: b.classSection, level: b.classLevel, letter: b.classLetter }
      )
      if (byClass !== 0) return byClass
      const bySubject = a.subjectName.localeCompare(b.subjectName, "fr", {
        sensitivity: "base",
      })
      if (bySubject !== 0) return bySubject
      return a.teacherName.localeCompare(b.teacherName, "fr", { sensitivity: "base" })
    })

    return NextResponse.json({ assignments: data, yearId, sort })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const body = await req.json()
    const {
      subjectId,
      teacherId,
      classId,
      classIds,
      weeklyHours,
      yearId: yearIdBody,
      syncSubjectTeacher,
    } = body

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
        where: {
          id: subjectIdNum,
          schoolId: user.schoolId,
          isActive: true,
          code: { startsWith: "CTEB-" },
          primaryBranches: { none: {} },
        },
      }),
      prisma.teacher.findFirst({
        where: { id: teacherIdNum, user: { schoolId: user.schoolId } },
      }),
      prisma.class.findMany({
        where: { id: { in: uniqueClassIds }, schoolId: user.schoolId },
        select: { id: true, name: true, section: true },
      }),
    ])

    if (!subject || !teacher) {
      return NextResponse.json({ error: "Matière ou professeur invalide" }, { status: 400 })
    }
    if (classRows.length !== uniqueClassIds.length) {
      return NextResponse.json({ error: "Une ou plusieurs classes sont invalides" }, { status: 400 })
    }

    const invalidSection = classRows.find(
      (c) => !(ASSIGNMENT_SECTIONS as readonly string[]).includes(c.section)
    )
    if (invalidSection) {
      return NextResponse.json(
        {
          error:
            "Les affectations catalogue concernent uniquement l'Éducation de Base (CTEB). Pour le primaire, utilisez le titulaire de classe.",
        },
        { status: 400 }
      )
    }

    const assignments = await prisma.$transaction(async (tx) => {
      const upserted = await Promise.all(
        uniqueClassIds.map((cid) =>
          tx.courseAssignment.upsert({
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

      // En modification : retire les classes désélectionnées pour ce prof + matière
      if (syncSubjectTeacher) {
        await tx.courseAssignment.updateMany({
          where: {
            schoolId: user.schoolId,
            yearId,
            subjectId: subjectIdNum,
            teacherId: teacherIdNum,
            isActive: true,
            classId: { notIn: uniqueClassIds },
          },
          data: { isActive: false },
        })
      }

      return upserted
    })

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
