import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStudentFromRequest } from "@/lib/student-auth"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"

const YEAR_STATUSES = ["ACTIVE", "GRADUATED", "CONFIRMEE", "INACTIVE", "PROPOSEE"] as const

/**
 * GET /api/student/fees/years
 * Années scolaires d'inscription pour consulter les frais correspondants.
 */
export async function GET(req: NextRequest) {
  const ctx = await getStudentFromRequest(req)
  if (!ctx?.studentId || !ctx.schoolId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const [enrollments, currentYearId] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        studentId: ctx.studentId,
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

  return NextResponse.json({
    years,
    currentYearId,
  })
}
