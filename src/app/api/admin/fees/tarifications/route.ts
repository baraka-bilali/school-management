import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createTarificationSchema } from "@/lib/fees/validation"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

// GET /api/admin/fees/tarifications
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const yearId = searchParams.get("yearId")
    const classId = searchParams.get("classId")
    const typeFraisId = searchParams.get("typeFraisId")

    const where: Record<string, unknown> = {
      schoolId: user.schoolId,
      isActive: true,
    }

    if (yearId) where.yearId = parseInt(yearId)
    if (classId) where.classId = parseInt(classId)
    if (typeFraisId) where.typeFraisId = parseInt(typeFraisId)

    const tarifications = await prisma.tarification.findMany({
      where,
      include: {
        typeFrais: { select: { id: true, nom: true, code: true } },
        year: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        echeances: { orderBy: { ordre: "asc" } },
        _count: { select: { paiements: true } },
      },
      orderBy: [{ year: { name: "desc" } }, { typeFrais: { nom: "asc" } }],
    })

    return NextResponse.json({ data: tarifications })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/admin/fees/tarifications
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])

    const body = await req.json()
    const data = createTarificationSchema.parse(body)

    // Vérifier que le type de frais existe et appartient à l'école
    const typeFrais = await prisma.typeFrais.findUnique({
      where: { id: data.typeFraisId },
    })
    if (!typeFrais || typeFrais.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Type de frais introuvable" }, { status: 404 })
    }

    // Vérifier que l'année scolaire existe
    const year = await prisma.academicYear.findUnique({
      where: { id: data.yearId },
    })
    if (!year) {
      return NextResponse.json({ error: "Année scolaire introuvable" }, { status: 404 })
    }

    // Vérifier la classe si spécifiée
    if (data.classId) {
      const cls = await prisma.class.findUnique({ where: { id: data.classId } })
      if (!cls) {
        return NextResponse.json({ error: "Classe introuvable" }, { status: 404 })
      }
    }

    // Vérifier l'unicité
    const existing = await prisma.tarification.findFirst({
      where: {
        typeFraisId: data.typeFraisId,
        yearId: data.yearId,
        classId: data.classId || null,
        schoolId: user.schoolId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Une tarification identique existe déjà" },
        { status: 409 }
      )
    }

    const tarification = await prisma.tarification.create({
      data: {
        typeFraisId: data.typeFraisId,
        yearId: data.yearId,
        classId: data.classId || null,
        montant: data.montant,
        description: data.description || null,
        schoolId: user.schoolId,
      },
      include: {
        typeFrais: { select: { nom: true, code: true } },
        year: { select: { name: true } },
        class: { select: { name: true } },
      },
    })

    return NextResponse.json({ data: tarification }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
