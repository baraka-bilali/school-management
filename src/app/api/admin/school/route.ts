import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie")
    const token = cookieHeader?.split("; ").find(row => row.startsWith("token="))?.split("=")[1]

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Vérifier que l'utilisateur a un schoolId
    if (!decoded.schoolId) {
      return NextResponse.json(
        { error: "Aucune école associée" },
        { status: 404 }
      )
    }

    const school = await prisma.school.findUnique({
      where: { id: decoded.schoolId },
      select: {
        id: true,
        nomEtablissement: true,
        adresse: true,
        telephone: true,
        email: true,
        etatCompte: true,
        dateDebutAbonnement: true,
        dateFinAbonnement: true,
        typePaiement: true,
        montantPaye: true,
      }
    })

    if (!school) {
      return NextResponse.json(
        { error: "École introuvable" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      school: {
        id: school.id,
        nomEtablissement: school.nomEtablissement,
        adresse: school.adresse,
        telephone: school.telephone,
        email: school.email,
        etatCompte: school.etatCompte,
        dateDebutAbonnement: school.dateDebutAbonnement,
        dateFinAbonnement: school.dateFinAbonnement,
        typePaiement: school.typePaiement,
        montantPaye: school.montantPaye,
      }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'école:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
