import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

async function requireSuperAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get('Cookie') || ''
  console.log('🍪 Cookie header:', cookieHeader ? 'present' : 'missing')
  
  const tokenMatch = cookieHeader.match(/token=([^;]+)/)
  
  if (!tokenMatch) {
    console.log('❌ No token found in cookies')
    return null
  }

  try {
    const token = tokenMatch[1]
    console.log('🔑 Token found, verifying...')
    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log('✅ Token valid, role:', decoded.role)
    
    if (decoded.role !== 'SUPER_ADMIN') {
      console.log('❌ User is not SUPER_ADMIN')
      return null
    }
    
    return decoded
  } catch (e: any) {
    console.log('❌ Token verification failed:', e.message)
    return null
  }
}

// GET: Récupérer une école spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireSuperAdmin(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const schoolId = parseInt(params.id)
    if (isNaN(schoolId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    })

    if (!school) {
      return NextResponse.json({ error: "École non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ school })
  } catch (error: any) {
    console.error('Error fetching school:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT: Mettre à jour une école
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireSuperAdmin(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const schoolId = parseInt(params.id)
    if (isNaN(schoolId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const body = await req.json()

    // Vérifier que l'école existe
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId }
    })

    if (!existingSchool) {
      return NextResponse.json({ error: "École non trouvée" }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {}

    // Informations générales
    if (body.nomEtablissement !== undefined) updateData.nomEtablissement = body.nomEtablissement
    if (body.typeEtablissement !== undefined) updateData.typeEtablissement = body.typeEtablissement
    if (body.codeEtablissement !== undefined) updateData.codeEtablissement = body.codeEtablissement || null
    if (body.anneeCreation !== undefined) updateData.anneeCreation = body.anneeCreation || null
    if (body.slogan !== undefined) updateData.slogan = body.slogan || null

    // Localisation (adresse est requis, ne pas convertir en null)
    if (body.adresse !== undefined) updateData.adresse = body.adresse
    if (body.ville !== undefined) updateData.ville = body.ville
    if (body.province !== undefined) updateData.province = body.province
    if (body.pays !== undefined) updateData.pays = body.pays || null

    // Contact (telephone et email sont requis, ne pas convertir en null)
    if (body.telephone !== undefined) updateData.telephone = body.telephone
    if (body.email !== undefined) updateData.email = body.email
    if (body.siteWeb !== undefined) updateData.siteWeb = body.siteWeb || null

    // Direction (directeurNom et directeurTelephone sont requis, ne pas convertir en null)
    if (body.directeurNom !== undefined) updateData.directeurNom = body.directeurNom
    if (body.directeurTelephone !== undefined) updateData.directeurTelephone = body.directeurTelephone
    if (body.directeurEmail !== undefined) updateData.directeurEmail = body.directeurEmail || null
    if (body.secretaireAcademique !== undefined) updateData.secretaireAcademique = body.secretaireAcademique || null
    if (body.comptable !== undefined) updateData.comptable = body.comptable || null
    if (body.personnelAdministratifTotal !== undefined) updateData.personnelAdministratifTotal = body.personnelAdministratifTotal || null

    // Informations légales
    if (body.rccm !== undefined) updateData.rccm = body.rccm || null
    if (body.idNat !== undefined) updateData.idNat = body.idNat || null
    if (body.nif !== undefined) updateData.nif = body.nif || null
    if (body.agrementMinisteriel !== undefined) updateData.agrementMinisteriel = body.agrementMinisteriel || null
    if (body.dateAgrement !== undefined) updateData.dateAgrement = body.dateAgrement || null

    // Académique
    if (body.cycles !== undefined) updateData.cycles = body.cycles || null
    if (body.nombreClasses !== undefined) {
      updateData.nombreClasses = body.nombreClasses ? parseInt(body.nombreClasses) : null
    }
    if (body.nombreEleves !== undefined) {
      updateData.nombreEleves = body.nombreEleves ? parseInt(body.nombreEleves) : null
    }
    if (body.nombreEnseignants !== undefined) {
      updateData.nombreEnseignants = body.nombreEnseignants ? parseInt(body.nombreEnseignants) : null
    }
    if (body.langueEnseignement !== undefined) updateData.langueEnseignement = body.langueEnseignement || null
    if (body.programmes !== undefined) updateData.programmes = body.programmes || null
    if (body.joursOuverture !== undefined) updateData.joursOuverture = body.joursOuverture || null

    // Mettre à jour l'école
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: updateData
    })

    return NextResponse.json({ 
      success: true,
      school: updatedSchool 
    })
  } catch (error: any) {
    console.error('Error updating school:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Supprimer une école
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireSuperAdmin(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

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

    // Supprimer l'école
    await prisma.school.delete({
      where: { id: schoolId }
    })

    return NextResponse.json({ 
      success: true,
      message: "École supprimée avec succès"
    })
  } catch (error: any) {
    console.error('Error deleting school:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
