import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { isStaffRole } from "@/lib/staff-roles"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

const MANAGER_ROLES = new Set(["ADMIN", "DIRECTEUR_ETUDES"])

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

// PATCH /api/admin/staff/[id] — activer / désactiver
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (!MANAGER_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const params = await context.params
    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const body = await req.json()
    const { isActive } = body
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive requis (boolean)" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, schoolId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }
    if (!isStaffRole(user.role)) {
      return NextResponse.json({ error: "Ce compte n'est pas un membre du personnel" }, { status: 400 })
    }
    if (user.schoolId !== auth.schoolId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error("Erreur PATCH staff:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
