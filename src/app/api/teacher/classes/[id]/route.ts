import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"
import { teacherHasClassAccess } from "@/lib/teacher-classes"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const classId = parseInt(id, 10)
  if (Number.isNaN(classId)) {
    return NextResponse.json({ error: "Classe invalide" }, { status: 400 })
  }

  const { teacherId, schoolId, yearId } = ctx
  if (!yearId) {
    return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
  }

  const allowed = await teacherHasClassAccess(teacherId, schoolId, yearId, classId)
  if (!allowed) {
    return NextResponse.json({ error: "Classe non assignée" }, { status: 403 })
  }

  const [classRow, assignments, enrollments, tasks] = await Promise.all([
    prisma.class.findFirst({
      where: { id: classId, schoolId },
      select: { id: true, name: true, level: true, section: true, letter: true, stream: true },
    }),
    prisma.courseAssignment.findMany({
      where: { teacherId, schoolId, yearId, classId, isActive: true },
      include: { subject: { select: { id: true, name: true, color: true } } },
      orderBy: { subject: { name: "asc" } },
    }),
    prisma.enrollment.findMany({
      where: { classId, yearId, status: "ACTIVE" },
      include: {
        student: {
          select: {
            id: true,
            code: true,
            lastName: true,
            middleName: true,
            firstName: true,
            gender: true,
            photoUrl: true,
          },
        },
      },
      orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
    }),
    prisma.studentTask.findMany({
      where: { teacherId, schoolId, classId, isActive: true },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ createdAt: "desc" }, { dueAt: "desc" }],
    }),
  ])

  if (!classRow) {
    return NextResponse.json({ error: "Classe introuvable" }, { status: 404 })
  }

  return NextResponse.json({
    class: classRow,
    subjects: assignments.map((a) => ({
      id: a.subject.id,
      name: a.subject.name,
      color: a.subject.color,
      weeklyHours: a.weeklyHours,
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      question: task.question,
      description: task.description,
      dueAt: task.dueAt,
      createdAt: task.createdAt,
      subject: task.subject
        ? {
            id: task.subject.id,
            name: task.subject.name,
            color: task.subject.color,
          }
        : null,
    })),
    students: enrollments.map((e) => ({
      id: e.student.id,
      code: e.student.code,
      lastName: e.student.lastName,
      middleName: e.student.middleName,
      firstName: e.student.firstName,
      gender: e.student.gender,
      photoUrl: e.student.photoUrl,
    })),
  })
}
