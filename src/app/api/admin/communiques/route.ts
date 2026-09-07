import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import {
  COMMUNIQUE_ATTACHMENT_MAX_BYTES,
  communiqueNotificationMessage,
} from "@/lib/communique-user-read"
import { STAFF_ROLES } from "@/lib/staff-roles"

function parseBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value
  if (value === "true" || value === 1 || value === "1") return true
  if (value === "false" || value === 0 || value === "0") return false
  return fallback
}

function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",")
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  return Math.floor((b64.length * 3) / 4)
}

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"])

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const yearIdParam = searchParams.get("yearId")
    const yearId = yearIdParam
      ? parseInt(yearIdParam)
      : await getSchoolCurrentYearId(user.schoolId)

    const where = {
      schoolId: user.schoolId,
      ...(yearId ? { yearId } : {}),
    }

    const [communiques, total] = await Promise.all([
      prisma.communique.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          createdBy: { select: { name: true, nom: true, prenom: true } },
          year: { select: { id: true, name: true } },
          _count: { select: { reads: true } },
        },
      }),
      prisma.communique.count({ where }),
    ])

    return NextResponse.json({
      communiques,
      total,
      page,
      hasMore: skip + communiques.length < total,
      yearId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"])

    const body = await req.json()
    const { title, content, attachmentUrl, attachmentName, attachmentMime } = body

    const targetStudents = parseBool(body.targetStudents, false)
    const targetParents = parseBool(body.targetParents, false)
    const targetTeachers = parseBool(body.targetTeachers, false)
    const targetStaff = parseBool(body.targetStaff, false)

    if (!title?.trim()) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 })
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Le contenu est requis" }, { status: 400 })
    }
    if (!targetStudents && !targetParents && !targetTeachers && !targetStaff) {
      return NextResponse.json(
        { error: "Sélectionnez au moins un destinataire" },
        { status: 400 }
      )
    }

    let safeAttachmentUrl: string | null = null
    let safeAttachmentName: string | null = null
    let safeAttachmentMime: string | null = null

    if (typeof attachmentUrl === "string" && attachmentUrl.trim()) {
      if (!attachmentUrl.startsWith("data:")) {
        return NextResponse.json({ error: "Pièce jointe invalide" }, { status: 400 })
      }
      if (estimateDataUrlBytes(attachmentUrl) > COMMUNIQUE_ATTACHMENT_MAX_BYTES) {
        return NextResponse.json(
          { error: "La pièce jointe ne doit pas dépasser 5 Mo" },
          { status: 400 }
        )
      }
      safeAttachmentUrl = attachmentUrl
      safeAttachmentName =
        typeof attachmentName === "string" && attachmentName.trim()
          ? attachmentName.trim().slice(0, 200)
          : "piece-jointe"
      safeAttachmentMime =
        typeof attachmentMime === "string" && attachmentMime.trim()
          ? attachmentMime.trim().slice(0, 120)
          : null
    }

    const yearId = await getSchoolCurrentYearId(user.schoolId)
    if (!yearId) {
      return NextResponse.json(
        { error: "Aucune année scolaire active. Configurez l'année dans Paramètres." },
        { status: 400 }
      )
    }

    const communique = await prisma.communique.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        schoolId: user.schoolId,
        yearId,
        createdById: user.id,
        targetStudents,
        targetParents,
        targetTeachers,
        targetStaff,
        attachmentUrl: safeAttachmentUrl,
        attachmentName: safeAttachmentName,
        attachmentMime: safeAttachmentMime,
      },
      include: {
        createdBy: { select: { name: true, nom: true, prenom: true } },
        year: { select: { id: true, name: true } },
      },
    })

    await getSupabaseAdmin()
      .channel(`communiques:school:${user.schoolId}`)
      .send({
        type: "broadcast",
        event: "new_communique",
        payload: {
          communiqueId: communique.id,
          yearId,
          targetStudents,
          targetParents,
          targetTeachers,
          targetStaff,
        },
      })

    const notifMessage = communiqueNotificationMessage(title.trim(), communique.id)
    const notifyUserIds = new Set<number>()

    if (targetTeachers) {
      const teachers = await prisma.teacher.findMany({
        where: { user: { schoolId: user.schoolId, isActive: true } },
        select: { userId: true },
      })
      teachers.forEach((t) => notifyUserIds.add(t.userId))
    }

    if (targetStaff) {
      const staffUsers = await prisma.user.findMany({
        where: {
          schoolId: user.schoolId,
          isActive: true,
          role: { in: [...STAFF_ROLES] },
        },
        select: { id: true },
      })
      staffUsers.forEach((u) => notifyUserIds.add(u.id))
    }

    if (targetParents) {
      const parents = await prisma.parent.findMany({
        where: { user: { schoolId: user.schoolId, isActive: true } },
        select: { userId: true },
      })
      parents.forEach((p) => notifyUserIds.add(p.userId))
    }

    if (targetStudents) {
      const students = await prisma.student.findMany({
        where: {
          user: { schoolId: user.schoolId, isActive: true },
        },
        select: { userId: true },
      })
      students.forEach((s) => {
        if (s.userId != null) notifyUserIds.add(s.userId)
      })
    }

    if (notifyUserIds.size > 0) {
      await prisma.notification.createMany({
        data: [...notifyUserIds].map((userId) => ({
          type: "SYSTEM_MESSAGE" as const,
          message: notifMessage,
          schoolId: user.schoolId,
          userId,
          targetRole: "SCHOOL_USER_ONLY" as const,
        })),
      })
    }

    return NextResponse.json({ communique }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
