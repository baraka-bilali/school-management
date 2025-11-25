import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  id: number
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
    const { isActive, nom, prenom, telephone, fonction } = body

    // Préparer les données à mettre à jour
    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (nom) updateData.nom = nom
    if (prenom) updateData.prenom = prenom
    if (telephone) updateData.telephone = telephone
    if (fonction) updateData.fonction = fonction

    // Mettre à jour l'administrateur
    const admin = await prisma.user.update({
      where: { id: adminId },
      data: updateData,
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

export async function DELETE(
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

    // Supprimer l'administrateur
    await prisma.user.delete({
      where: { id: adminId }
    })

    console.log(`✅ Administrateur supprimé: ID ${adminId}`)

    return NextResponse.json({
      success: true,
      message: "Administrateur supprimé avec succès"
    })

  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'administrateur" },
      { status: 500 }
    )
  }
}
