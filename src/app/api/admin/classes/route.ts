import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCached, invalidateCachePattern } from "@/lib/cache"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

const STREAM_LETTER_OPTIONAL = new Set([
  "Commerciale et Gestion", "Secrétariat",
  "Électricité", "Mécanique Générale", "Mécanique Automobile", "Électronique", "Aviation",
  "Construction", "Menuiserie", "Dessin de Bâtiment",
  "Agriculture Générale", "Vétérinaire", "Pêche et Forêt",
  "Sociale", "Arts Plastiques", "Musique", "Coupe et Couture", "Imprimerie",
  "Nutrition", "Santé Publique",
])

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

export async function GET(request: NextRequest) {
  const perfLabel = `[API-PERF] Classes fetch`
  console.time(perfLabel)
  
  try {
    // ✅ Vérification de l'authentification
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const schoolId = decoded.schoolId

    if (!schoolId) {
      return NextResponse.json(
        { error: "Aucune école associée à cet utilisateur" },
        { status: 403 }
      )
    }

    // Cache key par école
    const cacheKey = `classes-school-${schoolId}`

    const result = await getCached(cacheKey, async () => {
      const classes = await prisma.class.findMany({
        where: {
          schoolId: schoolId
        },
        orderBy: [
          { section: 'asc' },
          { level: 'asc' },
          { letter: 'asc' }
        ]
      })
      return { classes }
    }, 300000) // Cache de 5 minutes

    console.timeEnd(perfLabel)
    console.log(`[API-PERF] Returned ${result.classes.length} classes`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error)
    console.timeEnd(perfLabel)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // ✅ Vérification de l'authentification
    const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0]

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const schoolId = decoded.schoolId

    if (!schoolId) {
      return NextResponse.json(
        { error: "Aucune école associée à cet utilisateur" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { level, section, letter, stream } = body

    // Validation des champs obligatoires
    if (!level || !section) {
      return NextResponse.json(
        { error: 'Niveau et Section sont obligatoires' },
        { status: 400 }
      )
    }
    if (section !== "Maternelle" && !letter) {
      const isSpecializedStream = section === "Humanités" && STREAM_LETTER_OPTIONAL.has(stream)
      if (!isSpecializedStream) {
        return NextResponse.json(
          { error: 'La Lettre est obligatoire pour cette section' },
          { status: 400 }
        )
      }
    }

    // Générer le nom de la classe selon le format RDC
    let className: string
    if (section === "Maternelle") {
      className = letter ? `${level} ${letter} Maternelle` : `${level} Maternelle`
    } else if (section === "Humanités" && STREAM_LETTER_OPTIONAL.has(stream) && !letter) {
      className = `${level} Humanités${stream ? ` ${stream}` : ""}`
    } else {
      className = `${level} ${letter} ${section}`
      if (stream && section === "Humanités") {
        className += ` ${stream}`
      }
    }

    // ✅ Vérifier l'unicité du nom de la classe DANS CETTE ÉCOLE (composite unique: name + schoolId)
    const existingClass = await prisma.class.findFirst({
      where: { 
        name: className,
        schoolId: schoolId
      }
    })

    if (existingClass) {
      return NextResponse.json(
        { error: 'Une classe avec ce nom existe déjà dans votre école' },
        { status: 400 }
      )
    }

    // Vérifier l'unicité de la combinaison level + section + letter DANS CETTE ÉCOLE
    const existingCombination = await prisma.class.findFirst({
      where: {
        level,
        section,
        letter,
        schoolId: schoolId
      }
    })

    if (existingCombination) {
      return NextResponse.json(
        { error: 'Une classe avec cette combinaison Niveau + Section + Lettre existe déjà dans votre école' },
        { status: 400 }
      )
    }

    // ✅ Créer la classe avec le schoolId
    const newClass = await prisma.class.create({
      data: {
        name: className,
        level,
        section,
        letter,
        stream: stream || null,
        schoolId: schoolId
      }
    })

    // Invalider le cache des classes après création
    console.log('[CACHE-INVALIDATE] Invalidating classes-* cache after creation')
    invalidateCachePattern('classes-*')

    return NextResponse.json(newClass)
  } catch (error) {
    console.error('Erreur lors de la création de la classe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
