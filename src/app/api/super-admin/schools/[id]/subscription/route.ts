import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

async function requireSuperAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get('Cookie') || ''
  const tokenMatch = cookieHeader.match(/token=([^;]+)/)
  
  if (!tokenMatch) {
    return null
  }

  try {
    const token = tokenMatch[1]
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (decoded.role !== 'SUPER_ADMIN') {
      return null
    }
    
    return decoded
  } catch (e: any) {
    return null
  }
}

// PUT: Mettre à jour l'abonnement d'une école
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const params = await context.params
    const schoolId = parseInt(params.id)
    if (isNaN(schoolId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    // Vérifier que l'école existe
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId }
    })

    if (!existingSchool) {
      return NextResponse.json({ error: "École non trouvée" }, { status: 404 })
    }

    const body = await req.json()
    const {
      dateDebutAbonnement,
      dateFinAbonnement,
      periodeAbonnement,
      planAbonnement,
      typePaiement,
      montantPaye
    } = body

    // Mettre à jour l'abonnement
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        dateDebutAbonnement: dateDebutAbonnement ? new Date(dateDebutAbonnement) : null,
        dateFinAbonnement: dateFinAbonnement ? new Date(dateFinAbonnement) : null,
        periodeAbonnement: periodeAbonnement || null,
        planAbonnement: planAbonnement || null,
        typePaiement: typePaiement || null,
        montantPaye: montantPaye !== null && montantPaye !== undefined ? parseFloat(montantPaye) : null
      },
      select: {
        id: true,
        nomEtablissement: true,
        dateDebutAbonnement: true,
        dateFinAbonnement: true,
        periodeAbonnement: true,
        planAbonnement: true,
        typePaiement: true,
        montantPaye: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      school: updatedSchool,
      message: "Abonnement mis à jour avec succès"
    })

  } catch (e: any) {
    console.error("Erreur lors de la mise à jour de l'abonnement:", e)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'abonnement", details: e.message }, 
      { status: 500 }
    )
  }
}
