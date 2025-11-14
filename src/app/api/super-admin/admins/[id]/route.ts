import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  userId: number
  role: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = request.headers.get("cookie")
    const token = cookieHeader?.split("; ").find(row => row.startsWith("token="))?.split("=")[1]

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    
    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const adminId = parseInt(params.id)
    const body = await request.json()
    const { isActive } = body

    // Mettre à jour le statut
    const admin = await prisma.user.update({
      where: { id: adminId },
      data: { isActive },
      include: {
        school: {
          select: {
            nomEtablissement: true
          }
        }
      }
    })

    console.log(`✅ Statut administrateur mis à jour: ${admin.email} → ${isActive ? 'ACTIF' : 'INACTIF'}`)

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        isActive: admin.isActive,
        email: admin.email
      }
    })

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    )
  }
}
