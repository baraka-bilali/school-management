import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createTypeFraisSchema, updateTypeFraisSchema } from "@/lib/fees/validation"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

// GET /api/admin/fees/types - Lister les types de frais
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get("includeInactive") === "true"

    const where: { schoolId: number; isActive?: boolean } = { schoolId: user.schoolId }
    if (!includeInactive) {
      where.isActive = true
    }

    const typesFrais = await prisma.typeFrais.findMany({
      where,
      include: {
        _count: { select: { tarifications: true } },
      },
      orderBy: { nom: "asc" },
    })

    return NextResponse.json({ data: typesFrais })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/admin/fees/types - Créer un type de frais
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "SUPER_ADMIN"])

    const body = await req.json()
    const data = createTypeFraisSchema.parse(body)

    // Générer le code automatiquement à partir du nom
    const baseCode = data.nom
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .substring(0, 20)

    let code = baseCode
    let suffix = 1
    while (await prisma.typeFrais.findUnique({ where: { schoolId_code: { schoolId: user.schoolId, code } } })) {
      code = `${baseCode.substring(0, 17)}_${suffix}`
      suffix++
    }

    const typeFrais = await prisma.typeFrais.create({
      data: {
        ...data,
        code,
        schoolId: user.schoolId,
      },
    })

    return NextResponse.json({ data: typeFrais }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
