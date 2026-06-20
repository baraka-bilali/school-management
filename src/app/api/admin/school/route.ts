import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { z } from "zod"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

const BRANDING_ROLES = ["ADMIN", "SUPER_ADMIN", "COMPTABLE", "CAISSIER"]

function getAuthUser(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie")
  const token = cookieHeader?.split("; ").find((row) => row.startsWith("token="))?.split("=")[1]
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; schoolId?: number; role: string }
  } catch {
    return null
  }
}

const brandingSchema = z.object({
  logoUrl: z.string().nullable().optional(),
  sealUrl: z.string().nullable().optional(),
  profilePhotoUrl: z.string().nullable().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthUser(request)
    if (!decoded?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const school = await prisma.school.findUnique({
      where: { id: decoded.schoolId },
      select: {
        id: true,
        nomEtablissement: true,
        adresse: true,
        ville: true,
        telephone: true,
        email: true,
        slogan: true,
        logoUrl: true,
        sealUrl: true,
        profilePhotoUrl: true,
        etatCompte: true,
        dateDebutAbonnement: true,
        dateFinAbonnement: true,
        typePaiement: true,
        montantPaye: true,
      },
    })

    if (!school) {
      return NextResponse.json({ error: "École introuvable" }, { status: 404 })
    }

    return NextResponse.json({ school })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'école:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const decoded = getAuthUser(request)
    if (!decoded?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!BRANDING_ROLES.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const data = brandingSchema.parse(body)

    const updateData: Record<string, string | null> = {}
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl
    if (data.sealUrl !== undefined) updateData.sealUrl = data.sealUrl
    if (data.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = data.profilePhotoUrl

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    const school = await prisma.school.update({
      where: { id: decoded.schoolId },
      data: updateData,
      select: {
        id: true,
        nomEtablissement: true,
        adresse: true,
        ville: true,
        telephone: true,
        email: true,
        slogan: true,
        logoUrl: true,
        sealUrl: true,
        profilePhotoUrl: true,
      },
    })

    return NextResponse.json({ school, message: "Identité visuelle mise à jour" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }
    console.error("Erreur mise à jour école:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
