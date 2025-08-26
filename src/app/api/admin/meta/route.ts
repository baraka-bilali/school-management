import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Récupérer toutes les classes
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' }
    })

    // Récupérer toutes les années académiques
    const years = await prisma.academicYear.findMany({
      orderBy: { name: 'desc' }
    })

    // Récupérer l'année académique courante
    const currentYear = await prisma.academicYear.findFirst({
      where: { current: true }
    })

    return NextResponse.json({
      classes,
      years,
      currentYearId: currentYear?.id || null
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
