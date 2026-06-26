import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"

export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { teacherId, schoolId } = ctx
  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(schoolId))

  const [assignments, tasks, latestCommunique, year] = await Promise.all([
    yearId
      ? prisma.courseAssignment.findMany({
          where: { teacherId, schoolId, yearId, isActive: true },
          include: {
            class: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true, color: true } },
            slots: {
              where: { isActive: true },
              select: { dayOfWeek: true, startTime: true, endTime: true, room: true },
            },
          },
        })
      : Promise.resolve([]),
    prisma.studentTask.findMany({
      where: { teacherId, schoolId, isActive: true },
      orderBy: { dueAt: "asc" },
      take: 5,
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true, color: true } },
      },
    }),
    yearId
      ? prisma.communique.findFirst({
          where: { schoolId, yearId },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, createdAt: true },
        })
      : Promise.resolve(null),
    yearId
      ? prisma.academicYear.findUnique({ where: { id: yearId }, select: { name: true } })
      : Promise.resolve(null),
  ])

  const classIds = new Set(assignments.map((a) => a.classId))
  const slots = assignments.flatMap((a) =>
    a.slots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      className: a.class.name,
      subjectName: a.subject.name,
      subjectColor: a.subject.color,
    }))
  )

  return NextResponse.json({
    yearName: year?.name ?? null,
    classCount: classIds.size,
    courseCount: assignments.length,
    classes: Array.from(
      new Map(assignments.map((a) => [a.classId, { id: a.classId, name: a.class.name }])).values()
    ),
    slots,
    tasks,
    latestCommunique,
  })
}
