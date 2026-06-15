import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES", "PROFESSEUR"])

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId") ? parseInt(searchParams.get("classId")!) : undefined

    const tasks = await prisma.studentTask.findMany({
      where: {
        schoolId: user.schoolId,
        ...(classId ? { classId } : {}),
      },
      orderBy: { dueAt: "desc" },
      take: 50,
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "DIRECTEUR_ETUDES", "PROFESSEUR"])

    const body = await req.json()
    const { title, question, description, dueAt, classId, subjectId, teacherId } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 })
    }
    if (!dueAt) {
      return NextResponse.json({ error: "La date limite est requise" }, { status: 400 })
    }
    if (!classId || !teacherId) {
      return NextResponse.json({ error: "Classe et enseignant requis" }, { status: 400 })
    }

    const task = await prisma.studentTask.create({
      data: {
        title: title.trim(),
        question: question?.trim() || null,
        description: description?.trim() || null,
        dueAt: new Date(dueAt),
        classId: parseInt(classId),
        subjectId: subjectId ? parseInt(subjectId) : null,
        teacherId: parseInt(teacherId),
        schoolId: user.schoolId,
      },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    })

    await supabaseAdmin
      .channel(`tasks:class:${task.classId}`)
      .send({
        type: "broadcast",
        event: "new_task",
        payload: { taskId: task.id },
      })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
