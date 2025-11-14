import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { generateSchoolCredentials } from "@/lib/generateCredentials"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  userId: number
  role: string
}

export async function GET(request: NextRequest) {
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

    // Récupérer tous les administrateurs d'écoles
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN"
      },
      include: {
        school: {
          select: {
            id: true,
            nomEtablissement: true,
            ville: true,
            province: true,
            etatCompte: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    return NextResponse.json({ admins })

  } catch (error) {
    console.error("❌ Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des administrateurs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { schoolId, nom, prenom, email, telephone, fonction } = body

    // Validation
    if (!schoolId || !nom || !prenom || !email) {
      return NextResponse.json(
        { error: "Données incomplètes (école, nom, prénom et email requis)" },
        { status: 400 }
      )
    }

    // Vérifier si l'école existe
    const school = await prisma.school.findUnique({
      where: { id: parseInt(schoolId) }
    })

    if (!school) {
      return NextResponse.json(
        { error: "École introuvable" },
        { status: 404 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Générer un mot de passe temporaire (8 caractères alphanumériques)
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase()

    // Hasher le mot de passe temporaire
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Créer l'administrateur
    const admin = await prisma.user.create({
      data: {
        nom,
        prenom,
        email: email.toLowerCase().trim(),
        telephone: telephone || "",
        fonction: fonction || "Administrateur",
        password: hashedPassword,
        role: "ADMIN",
        schoolId: parseInt(schoolId),
        dateCreation: new Date(),
        temporaryPassword: true, // Marquer le mot de passe comme temporaire
        name: `${prenom} ${nom}` // Pour compatibilité
      },
      include: {
        school: {
          select: {
            nomEtablissement: true
          }
        }
      }
    })

    console.log(`✅ Administrateur créé: ${admin.email}`)

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        nom: admin.nom,
        prenom: admin.prenom,
        email: admin.email,
        schoolName: admin.school?.nomEtablissement
      },
      email: admin.email,
      password: tempPassword // Mot de passe temporaire en clair pour l'afficher au super admin
    })

  } catch (error) {
    console.error("❌ Erreur lors de la création:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'administrateur" },
      { status: 500 }
    )
  }
}
