import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"])

    const { id } = await params
    const communiqueId = parseInt(id)

    const communique = await prisma.communique.findFirst({
      where: { id: communiqueId, schoolId: user.schoolId },
      include: {
        createdBy: { select: { name: true, nom: true, prenom: true } },
        _count: { select: { reads: true } },
      },
    })

    if (!communique) {
      return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 })
    }

    return NextResponse.json({ communique })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"])

    const { id } = await params
    const communiqueId = parseInt(id)

    const communique = await prisma.communique.findFirst({
      where: { id: communiqueId, schoolId: user.schoolId },
    })

    if (!communique) {
      return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 })
    }

    const body = await req.json()
    const { title, content } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 })
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Le contenu est requis" }, { status: 400 })
    }

    const updated = await prisma.communique.update({
      where: { id: communiqueId },
      data: {
        title: title.trim(),
        content: content.trim(),
      },
      include: {
        createdBy: { select: { name: true, nom: true, prenom: true } },
        _count: { select: { reads: true } },
      },
    })

    return NextResponse.json({ communique: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"])

    const { id } = await params
    const communiqueId = parseInt(id)

    const communique = await prisma.communique.findFirst({
      where: { id: communiqueId, schoolId: user.schoolId },
    })

    if (!communique) {
      return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 })
    }

    await prisma.communique.delete({ where: { id: communiqueId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
