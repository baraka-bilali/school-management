import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { teacherId, schoolId, yearId } = ctx
  if (!yearId) {
    return NextResponse.json({ yearName: null, classes: [] })
  }

  const [assignments, year, enrollmentCounts] = await Promise.all([
    prisma.courseAssignment.findMany({
      where: { teacherId, schoolId, yearId, isActive: true },
      include: {
        class: { select: { id: true, name: true, level: true, section: true, letter: true } },
        subject: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
    }),
    prisma.academicYear.findUnique({ where: { id: yearId }, select: { name: true } }),
    prisma.enrollment.groupBy({
      by: ["classId"],
      where: { yearId, status: "ACTIVE", class: { schoolId } },
      _count: { studentId: true },
    }),
  ])

  const countByClass = new Map(enrollmentCounts.map((e) => [e.classId, e._count.studentId]))
  const byClass = new Map<
    number,
    {
      id: number
      name: string
      level: string
      section: string
      letter: string
      studentCount: number
      subjects: Array<{ id: number; name: string; color: string | null; weeklyHours: number }>
    }
  >()

  for (const a of assignments) {
    const existing = byClass.get(a.classId)
    const subject = {
      id: a.subject.id,
      name: a.subject.name,
      color: a.subject.color,
      weeklyHours: a.weeklyHours,
    }
    if (existing) {
      if (!existing.subjects.some((s) => s.id === subject.id)) {
        existing.subjects.push(subject)
      }
    } else {
      byClass.set(a.classId, {
        id: a.class.id,
        name: a.class.name,
        level: a.class.level,
        section: a.class.section,
        letter: a.class.letter,
        studentCount: countByClass.get(a.classId) ?? 0,
        subjects: [subject],
      })
    }
  }

  return NextResponse.json({
    yearName: year?.name ?? null,
    classes: Array.from(byClass.values()),
  })
}
