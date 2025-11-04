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
      // include firstName as well so searching by first name works
      // remove explicit `mode: 'insensitive'` to avoid potential DB/Prisma limitations
      where.OR = [
        { lastName: { contains: q } },
        { middleName: { contains: q } },
        { firstName: { contains: q } },
        { code: { contains: q } }
      ]
    }

    // Filtre par classe et/ou année académique
    if (classId || yearId) {
      const enrollmentWhere: any = {}
      if (classId) enrollmentWhere.classId = parseInt(classId)
      if (yearId) enrollmentWhere.yearId = parseInt(yearId)

      where.enrollments = {
        some: enrollmentWhere
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

    // Debug logging for incoming query and constructed filters
    console.log('GET /api/admin/students params:', { q, classId, yearId, sort, page, pageSize })
    console.log('Constructed where:', JSON.stringify(where))
    console.log('Constructed orderBy:', JSON.stringify(orderBy))

    // Compter le total
    let total
    let students
    try {
      total = await prisma.student.count({ where })
    } catch (err) {
      console.error('Error counting students with where:', JSON.stringify(where), err)
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }

    // Récupérer les étudiants avec pagination
    try {
      students = await prisma.student.findMany({
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
    } catch (err) {
      console.error('Error finding students with where/orderBy:', JSON.stringify({ where, orderBy }), err)
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }

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
