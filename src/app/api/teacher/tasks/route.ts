import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get("classId") ? parseInt(searchParams.get("classId")!) : undefined
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

  const tasks = await prisma.studentTask.findMany({
    where: {
      teacherId: ctx.teacherId,
      schoolId: ctx.schoolId,
      isActive: true,
      ...(classId ? { classId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { dueAt: "desc" }],
    take: limit,
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, color: true } },
    },
  })

  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const { title, question, description, dueAt, classId, subjectId } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: "Le titre est requis" }, { status: 400 })
  }
  if (!dueAt || !classId) {
    return NextResponse.json({ error: "Classe et date limite requises" }, { status: 400 })
  }

  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      teacherId: ctx.teacherId,
      classId: parseInt(classId),
      schoolId: ctx.schoolId,
      isActive: true,
      ...(subjectId ? { subjectId: parseInt(subjectId) } : {}),
    },
  })

  if (!assignment) {
    return NextResponse.json({ error: "Vous n'enseignez pas dans cette classe" }, { status: 403 })
  }

  const task = await prisma.studentTask.create({
    data: {
      title: title.trim(),
      question: question?.trim() || null,
      description: description?.trim() || null,
      dueAt: new Date(dueAt),
      classId: parseInt(classId),
      subjectId: subjectId ? parseInt(subjectId) : assignment.subjectId,
      teacherId: ctx.teacherId,
      schoolId: ctx.schoolId,
    },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true, color: true } },
    },
  })

  await getSupabaseAdmin()
    .channel(`tasks:class:${task.classId}`)
    .send({
      type: "broadcast",
      event: "new_task",
      payload: { taskId: task.id },
    })

  return NextResponse.json({ task }, { status: 201 })
}
