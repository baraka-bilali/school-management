import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { buildStudentEmail, generatePassword } from "@/lib/generateCredentials"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const classId = searchParams.get('classId')
    const yearId = searchParams.get('yearId')
    const sort = searchParams.get('sort') || 'name_asc'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Construire les filtres
    const where: any = {}
    
    if (q) {
      where.OR = [
        { lastName: { contains: q, mode: 'insensitive' } },
        { middleName: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } }
      ]
    }

    // Filtre par classe
    if (classId) {
      where.enrollments = {
        some: {
          classId: parseInt(classId)
        }
      }
    }

    // Filtre par année académique
    if (yearId) {
      where.enrollments = {
        some: {
          yearId: parseInt(yearId)
        }
      }
    }

    // Construire le tri
    let orderBy: any = {}
    switch (sort) {
      case 'name_asc':
        orderBy = { lastName: 'asc' }
        break
      case 'name_desc':
        orderBy = { lastName: 'desc' }
        break
      case 'class':
        orderBy = { enrollments: { class: { name: 'asc' } } }
        break
      default:
        orderBy = { lastName: 'asc' }
    }

    // Compter le total
    const total = await prisma.student.count({ where })

    // Récupérer les étudiants avec pagination
    const students = await prisma.student.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        enrollments: {
          include: {
            class: true,
            year: true
          }
        }
      }
    })

    return NextResponse.json({
      items: students,
      total,
      page,
      pageSize
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      lastName,
      middleName,
      firstName,
      gender,
      birthDate,
      code,
      classId,
      academicYearId,
    } = body

    // Vérifier que l'année académique existe
    let yearId = academicYearId
    if (!yearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { current: true }
      })
      if (!currentYear) {
        return NextResponse.json(
          { error: 'Aucune année académique courante configurée' },
          { status: 400 }
        )
      }
      yearId = currentYear.id
    }

    // Générer email et mot de passe
    const email = buildStudentEmail({ lastName, middleName, code })
    const plaintextPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(plaintextPassword, 10)

    // Créer l'utilisateur et l'étudiant dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          name: `${lastName} ${firstName}`,
          email,
          password: hashedPassword,
          role: "ELEVE",
        },
      })

      // Créer l'étudiant
      const student = await tx.student.create({
        data: {
          lastName,
          middleName,
          firstName,
          gender,
          birthDate: new Date(birthDate),
          code,
          userId: user.id,
        },
      })

      // Créer l'inscription
      await tx.enrollment.create({
        data: {
          studentId: student.id,
          classId: parseInt(classId),
          yearId: parseInt(yearId),
          status: "ACTIVE",
        },
      })

      return { user, student }
    })

    return NextResponse.json({ 
      ...result, 
      plaintextPassword 
    })
  } catch (e: any) {
    console.error(e)
    if (e.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email ou code déjà utilisé' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
