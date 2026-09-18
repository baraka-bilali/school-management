import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getParentFromRequest, assertParentChildLink } from "@/lib/parent-auth"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"

const YEAR_STATUSES = ["ACTIVE", "GRADUATED", "CONFIRMEE", "INACTIVE", "PROPOSEE"] as const

/**
 * GET /api/parent/children/[studentId]/bulletins/years
 * Années d'inscription de l'enfant lié au parent.
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

  const student = await prisma.student.findFirst({
    where: { id: studentId },
    select: {
      id: true,
      permanentCode: true,
      lastName: true,
      middleName: true,
      firstName: true,
    },
  })
  if (!student) {
    return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
  }

  const [enrollments, currentYearId] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        studentId,
        status: { in: [...YEAR_STATUSES] },
        class: { schoolId: ctx.schoolId },
      },
      include: {
        year: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, section: true, level: true } },
      },
      orderBy: { year: { name: "desc" } },
    }),
    getSchoolCurrentYearId(ctx.schoolId),
  ])

  const seen = new Set<number>()
  const years = []
  for (const enr of enrollments) {
    if (seen.has(enr.yearId)) continue
    seen.add(enr.yearId)
    const isCurrent = currentYearId != null && enr.yearId === currentYearId
    years.push({
      yearId: enr.yearId,
      name: enr.year.name,
      isCurrent,
      classId: enr.classId,
      className: enr.class.name,
      section: enr.class.section,
      level: enr.class.level,
      enrollmentId: enr.id,
      enrollmentStatus: enr.status,
    })
  }

  years.sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1
    return b.name.localeCompare(a.name, "fr")
  })

  const fullName = [student.lastName, student.middleName, student.firstName]
    .filter(Boolean)
    .join(" ")

  return NextResponse.json({
    student: {
      id: student.id,
      code: student.permanentCode,
      fullName,
      firstName: student.firstName,
      lastName: student.lastName,
      relationship: link.relationship,
    },
    years,
    currentYearId,
  })
}
