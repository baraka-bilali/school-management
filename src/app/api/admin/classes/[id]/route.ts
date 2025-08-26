import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await req.json()
    const { level, section, letter, stream } = body

    // Validation des champs obligatoires
    if (!level || !section || !letter) {
      return NextResponse.json(
        { error: 'Niveau, Section et Lettre sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier que la classe existe
    const existingClass = await prisma.class.findUnique({
      where: { id }
    })

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Classe non trouvée' },
        { status: 404 }
      )
    }

    // Générer le nouveau nom de la classe
    let className = `${level} ${letter} ${section}`
    if (stream && (section === "Secondaire" || section === "Supérieur")) {
      className += ` ${stream}`
    }

    // Vérifier l'unicité du nom de la classe (exclure la classe actuelle)
    const duplicateName = await prisma.class.findFirst({
      where: {
        name: className,
        id: { not: id }
      }
    })

    if (duplicateName) {
      return NextResponse.json(
        { error: 'Une classe avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    // Vérifier l'unicité de la combinaison level + section + letter (exclure la classe actuelle)
    const duplicateCombination = await prisma.class.findFirst({
      where: {
        level,
        section,
        letter,
        id: { not: id }
      }
    })

    if (duplicateCombination) {
      return NextResponse.json(
        { error: 'Une classe avec cette combinaison Niveau + Section + Lettre existe déjà' },
        { status: 400 }
      )
    }

    // Mettre à jour la classe
    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: className,
        level,
        section,
        letter,
        stream: stream || null
      }
    })

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la classe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    // Vérifier que la classe existe
    const existingClass = await prisma.class.findUnique({
      where: { id }
    })

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Classe non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des inscriptions liées à cette classe
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: id }
    })

    if (enrollments.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer cette classe car elle a des élèves inscrits' },
        { status: 400 }
      )
    }

    // Supprimer la classe
    await prisma.class.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression de la classe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
