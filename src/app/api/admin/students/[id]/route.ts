import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: any) {
  try {
    const studentId = Number(params.id)
    if (isNaN(studentId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const data = await request.json()
    
    // Valider les données requises
    const requiredFields = ["lastName", "middleName", "firstName", "gender", "birthDate", "code"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        )
      }
    }

    // Mettre à jour les informations de base de l'étudiant
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        code: data.code,
        lastName: data.lastName,
        middleName: data.middleName,
        firstName: data.firstName,
        gender: data.gender,
        birthDate: new Date(data.birthDate),
      },
      include: {
        enrollments: {
          include: {
            class: true,
            year: true,
          },
        },
      },
    })

    // Si une nouvelle classe est spécifiée, mettre à jour l'inscription
    if (data.classId) {
      // Trouver l'inscription actuelle
      const currentEnrollment = updatedStudent.enrollments[0]

      // Récupérer l'année académique actuelle si non spécifiée
      let yearId = data.yearId ? Number(data.yearId) : undefined
      if (!yearId) {
        const currentYear = await prisma.academicYear.findFirst({
          where: { current: true }
        })
        if (!currentYear) {
          return NextResponse.json(
            { error: "Aucune année académique active trouvée" },
            { status: 400 }
          )
        }
        yearId = currentYear.id
      }

      if (currentEnrollment) {
        // Mettre à jour l'inscription existante
        await prisma.enrollment.update({
          where: { id: currentEnrollment.id },
          data: { 
            classId: Number(data.classId),
            yearId: yearId 
          },
        })
      } else {
        // Créer une nouvelle inscription si aucune n'existe
        await prisma.enrollment.create({
          data: {
            studentId: studentId,
            classId: Number(data.classId),
            yearId: yearId,
          },
        })
      }
    }

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'étudiant:", error)
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'étudiant" },
      { status: 500 }
    )
  }
}