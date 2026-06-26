import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"
import { supabaseAdmin } from "@/lib/supabase-server"
import { communiqueNotificationMessage } from "@/lib/communique-user-read"

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
    const { title, content } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 })
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Le contenu est requis" }, { status: 400 })
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
      },
      include: {
        createdBy: { select: { name: true, nom: true, prenom: true } },
        year: { select: { id: true, name: true } },
      },
    })

    // Broadcast realtime + notifications professeurs
    await supabaseAdmin
      .channel(`communiques:school:${user.schoolId}`)
      .send({
        type: "broadcast",
        event: "new_communique",
        payload: { communiqueId: communique.id, yearId },
      })

    const teachers = await prisma.teacher.findMany({
      where: {
        user: { schoolId: user.schoolId, isActive: true },
      },
      select: { userId: true },
    })

    if (teachers.length > 0) {
      await prisma.notification.createMany({
        data: teachers.map((t) => ({
          type: "SYSTEM_MESSAGE" as const,
          message: communiqueNotificationMessage(title.trim(), communique.id),
          schoolId: user.schoolId,
          userId: t.userId,
          targetRole: "SCHOOL_USER_ONLY" as const,
        })),
      })
    }

    return NextResponse.json({ communique }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
