import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      orderBy: [
        { section: 'asc' },
        { level: 'asc' },
        { letter: 'asc' }
      ]
    })

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { level, section, letter, stream } = body

    // Validation des champs obligatoires
    if (!level || !section || !letter) {
      return NextResponse.json(
        { error: 'Niveau, Section et Lettre sont obligatoires' },
        { status: 400 }
      )
    }

    // Générer le nom de la classe selon le format RDC
    let className = `${level} ${letter} ${section}`
    if (stream && (section === "Secondaire" || section === "Supérieur")) {
      className += ` ${stream}`
    }

    // Vérifier l'unicité du nom de la classe
    const existingClass = await prisma.class.findUnique({
      where: { name: className }
    })

    if (existingClass) {
      return NextResponse.json(
        { error: 'Une classe avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    // Vérifier l'unicité de la combinaison level + section + letter
    const existingCombination = await prisma.class.findFirst({
      where: {
        level,
        section,
        letter
      }
    })

    if (existingCombination) {
      return NextResponse.json(
        { error: 'Une classe avec cette combinaison Niveau + Section + Lettre existe déjà' },
        { status: 400 }
      )
    }

    // Créer la classe
    const newClass = await prisma.class.create({
      data: {
        name: className,
        level,
        section,
        letter,
        stream: stream || null
      }
    })

    return NextResponse.json(newClass)
  } catch (error) {
    console.error('Erreur lors de la création de la classe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
