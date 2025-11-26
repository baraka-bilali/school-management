import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

// GET /api/admin/students/[id] - Récupérer les détails complets d'un élève
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload

    const allowedRoles = ["ADMIN", "COMPTABLE", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const params = await context.params
    const studentId = parseInt(params.id)

    if (isNaN(studentId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    // Récupérer toutes les informations de l'élève
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            email: true,
            telephone: true,
            nom: true,
            prenom: true,
            isActive: true,
            schoolId: true,
            school: {
              select: {
                nomEtablissement: true,
              }
            }
          }
        },
        enrollments: {
          include: {
            class: true,
            year: true,
          },
          orderBy: {
            year: {
              startDate: 'desc'
            }
          },
          take: 1
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    // Vérifier que l'élève appartient à l'école de l'admin (si schoolId est défini)
    if (decoded.schoolId && student.user?.schoolId && student.user.schoolId !== decoded.schoolId) {
      return NextResponse.json({ error: "Accès refusé à cet élève" }, { status: 403 })
    }
    return NextResponse.json({ student })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'élève:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

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