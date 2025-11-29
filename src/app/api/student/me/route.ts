import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  id: number
  role: string
  schoolId?: number
}

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie")
    const token = cookieHeader?.split("; ").find(row => row.startsWith("token="))?.split("=")[1]

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    
    if (decoded.role !== "ELEVE") {
      return NextResponse.json({ error: "Accès réservé aux élèves" }, { status: 403 })
    }

    // Récupérer l'élève avec ses informations
    const student = await prisma.student.findFirst({
      where: {
        userId: decoded.id
      },
      include: {
        user: {
          select: {
            email: true,
            school: {
              select: {
                nomEtablissement: true
              }
            }
          }
        },
        enrollments: {
          where: {
            status: "ACTIVE"
          },
          include: {
            class: {
              select: {
                name: true
              }
            },
            year: {
              select: {
                name: true,
                current: true
              }
            }
          },
          orderBy: {
            year: {
              name: "desc"
            }
          },
          take: 1
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    const currentEnrollment = student.enrollments[0]

    return NextResponse.json({
      student: {
        id: student.id,
        lastName: student.lastName,
        middleName: student.middleName,
        firstName: student.firstName,
        code: student.code,
        gender: student.gender,
        birthDate: student.birthDate,
        email: student.user.email,
        school: student.user.school?.nomEtablissement,
        class: currentEnrollment?.class?.name,
        year: currentEnrollment?.year?.name
      }
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des infos élève:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
