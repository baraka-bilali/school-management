import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { teacher, schoolId, yearId } = ctx
  const school = teacher.user.school

  let yearName: string | null = null
  if (yearId) {
    const year = await prisma.academicYear.findUnique({
      where: { id: yearId },
      select: { name: true },
    })
    yearName = year?.name ?? null
  }

  const assignments = yearId
    ? await prisma.courseAssignment.findMany({
        where: { teacherId: teacher.id, schoolId, yearId, isActive: true },
        include: {
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, color: true } },
        },
        orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
      })
    : []

  const uniqueClasses = new Map<number, string>()
  for (const a of assignments) {
    uniqueClasses.set(a.classId, a.class.name)
  }

  return NextResponse.json({
    teacher: {
      id: teacher.id,
      userId: teacher.user.id,
      schoolId,
      yearId,
      lastName: teacher.lastName,
      middleName: teacher.middleName,
      firstName: teacher.firstName,
      gender: teacher.gender,
      birthDate: teacher.birthDate,
      specialty: teacher.specialty,
      phone: teacher.phone,
      hiredAt: teacher.hiredAt,
      email: teacher.user.email,
      school: school?.nomEtablissement,
      schoolPhotoUrl: school?.profilePhotoUrl || school?.logoUrl || null,
      year: yearName,
      classCount: uniqueClasses.size,
      courseCount: assignments.length,
      classes: Array.from(uniqueClasses.entries()).map(([id, name]) => ({ id, name })),
      assignments: assignments.map((a) => ({
        id: a.id,
        classId: a.classId,
        className: a.class.name,
        subjectId: a.subjectId,
        subjectName: a.subject.name,
        subjectColor: a.subject.color,
        weeklyHours: a.weeklyHours,
      })),
    },
  })
}
