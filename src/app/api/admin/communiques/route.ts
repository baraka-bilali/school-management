import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"])

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [communiques, total] = await Promise.all([
      prisma.communique.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          createdBy: { select: { name: true, nom: true, prenom: true } },
          _count: { select: { reads: true } },
        },
      }),
      prisma.communique.count({ where: { schoolId: user.schoolId } }),
    ])

    return NextResponse.json({
      communiques,
      total,
      page,
      hasMore: skip + communiques.length < total,
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

    const communique = await prisma.communique.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        schoolId: user.schoolId,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { name: true, nom: true, prenom: true } },
      },
    })

    // Broadcast realtime to all students of this school
    await supabaseAdmin
      .channel(`communiques:school:${user.schoolId}`)
      .send({
        type: "broadcast",
        event: "new_communique",
        payload: { communiqueId: communique.id },
      })

    return NextResponse.json({ communique }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
