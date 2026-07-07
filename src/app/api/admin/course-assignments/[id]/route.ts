import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)
    const { id } = await params
    const assignmentId = parseInt(id, 10)
    if (Number.isNaN(assignmentId)) {
      return NextResponse.json({ error: "Affectation invalide" }, { status: 400 })
    }

    const body = await req.json()
    const { subjectId, teacherId, classId, weeklyHours } = body

    if (!subjectId || !teacherId || !classId) {
      return NextResponse.json({ error: "Matière, professeur et classe requis" }, { status: 400 })
    }

    const existing = await prisma.courseAssignment.findFirst({
      where: { id: assignmentId, schoolId: user.schoolId, isActive: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Affectation introuvable" }, { status: 404 })
    }

    const newSubjectId = parseInt(subjectId, 10)
    const newTeacherId = parseInt(teacherId, 10)
    const newClassId = parseInt(classId, 10)
    const newWeeklyHours = weeklyHours ? parseFloat(weeklyHours) : existing.weeklyHours

    const [subject, teacher, cls] = await Promise.all([
      prisma.subject.findFirst({ where: { id: newSubjectId, schoolId: user.schoolId, isActive: true } }),
      prisma.teacher.findFirst({ where: { id: newTeacherId, user: { schoolId: user.schoolId } } }),
      prisma.class.findFirst({ where: { id: newClassId, schoolId: user.schoolId } }),
    ])

    if (!subject || !teacher || !cls) {
      return NextResponse.json({ error: "Matière, professeur ou classe invalide" }, { status: 400 })
    }

    if (newSubjectId !== existing.subjectId || newClassId !== existing.classId) {
      const conflict = await prisma.courseAssignment.findFirst({
        where: {
          subjectId: newSubjectId,
          classId: newClassId,
          yearId: existing.yearId,
          schoolId: user.schoolId,
          isActive: true,
          id: { not: assignmentId },
        },
      })
      if (conflict) {
        return NextResponse.json(
          { error: "Cette matière est déjà assignée à cette classe pour l'année en cours" },
          { status: 409 }
        )
      }
    }

    const assignment = await prisma.courseAssignment.update({
      where: { id: assignmentId },
      data: {
        subjectId: newSubjectId,
        teacherId: newTeacherId,
        classId: newClassId,
        weeklyHours: newWeeklyHours,
      },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { lastName: true, middleName: true, firstName: true } },
        class: { select: { name: true } },
        year: { select: { name: true } },
      },
    })

    return NextResponse.json({ assignment })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)
    const { id } = await params

    const existing = await prisma.courseAssignment.findFirst({
      where: { id: parseInt(id), schoolId: user.schoolId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Affectation introuvable" }, { status: 404 })
    }

    await prisma.courseAssignment.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
