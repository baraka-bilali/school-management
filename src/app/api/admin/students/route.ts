import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { buildStudentEmail, generatePassword } from "@/lib/generateCredentials"
import { getCached, invalidateCachePattern } from "@/lib/cache"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

export async function GET(req: NextRequest) {
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
      // IMPORTANT: MySQL ne supporte pas mode: 'insensitive'
      // Solution: Rechercher avec contains (sensible à la casse par défaut)
      // MySQL avec collation utf8mb4_general_ci est insensible à la casse par défaut
      const searchTerm = q.trim()
      
      where.OR = [
        { lastName: { contains: searchTerm } },
        { middleName: { contains: searchTerm } },
        { firstName: { contains: searchTerm } },
        { code: { contains: searchTerm } }
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
    // Note: Le tri par classe se fera côté application car Prisma ne peut pas trier par relation many
    let orderBy: any = {}
    const shouldSortByClass = sort === 'class'
    
    switch (sort) {
      case 'name_asc':
        orderBy = { lastName: 'asc' }
        break
      case 'name_desc':
        orderBy = { lastName: 'desc' }
        break
      case 'class':
        // Tri par défaut lastName, on triera côté application après
        orderBy = { lastName: 'asc' }
        break
      default:
        orderBy = { lastName: 'asc' }
    }

    // Debug logging for incoming query and constructed filters
    const perfLabel = `[API-PERF] Students query (q="${q}", page=${page})`
    console.log('GET /api/admin/students params:', { q, classId, yearId, sort, page, pageSize })
    console.log('Constructed where:', JSON.stringify(where))
    console.log('Constructed orderBy:', JSON.stringify(orderBy))
    console.time(perfLabel)

    // Clé de cache unique basée sur les paramètres de recherche
    const cacheKey = `students-${q || 'all'}-${classId || 'all'}-${yearId || 'all'}-${sort}-${page}-${pageSize}`
    
    // Utiliser le cache pour cette requête (5 minutes de cache)
    const result = await getCached(cacheKey, async () => {
      let total
      let students
      
      try {
        console.time(`${perfLabel} - count`)
        total = await prisma.student.count({ where })
        console.timeEnd(`${perfLabel} - count`)
      } catch (err) {
        console.error('Error counting students with where:', JSON.stringify(where), err)
        throw err
      }

      // Récupérer les étudiants avec pagination
      // Optimisation: Utiliser select au lieu de include pour réduire la taille des données
      try {
        console.time(`${perfLabel} - findMany`)
        students = await prisma.student.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            code: true,
            lastName: true,
            middleName: true,
            firstName: true,
            gender: true,
            birthDate: true,
            enrollments: {
              select: {
                id: true,
                classId: true,
                yearId: true,
                status: true,
                class: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                year: {
                  select: {
                    id: true,
                    name: true,
                    current: true
                  }
                }
              }
            }
          }
        })
        console.timeEnd(`${perfLabel} - findMany`)
      } catch (err) {
        console.error('Error finding students with where/orderBy:', JSON.stringify({ where, orderBy }), err)
        console.timeEnd(`${perfLabel} - findMany`)
        throw err
      }
      
      // Tri par classe si demandé (côté application car Prisma ne peut pas trier par relation many)
      if (shouldSortByClass) {
        students.sort((a: any, b: any) => {
          const classA = a.enrollments?.[0]?.class?.name || ''
          const classB = b.enrollments?.[0]?.class?.name || ''
          return classA.localeCompare(classB)
        })
      }

      return { items: students, total, page, pageSize }
    }, 300000) // Cache de 5 minutes

    console.timeEnd(perfLabel)
    console.log(`[API-PERF] Returned ${result.items.length} students out of ${result.total} total`)
    
    // Log détaillé pour débuggage si recherche active
    if (q) {
      console.log(`[SEARCH-DEBUG] Searching for: "${q}"`)
      console.log(`[SEARCH-DEBUG] Found ${result.total} matching students`)
      if (result.items.length > 0) {
        console.log(`[SEARCH-DEBUG] First result:`, {
          code: result.items[0].code,
          lastName: result.items[0].lastName,
          firstName: result.items[0].firstName
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const token = req.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const adminSchoolId = decoded.schoolId

    if (!adminSchoolId) {
      return NextResponse.json({ error: "Aucune école associée" }, { status: 403 })
    }

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
      // Créer l'utilisateur avec le schoolId de l'admin
      const user = await tx.user.create({
        data: {
          name: `${lastName} ${firstName}`,
          email,
          password: hashedPassword,
          role: "ELEVE",
          schoolId: adminSchoolId,
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

    // Invalider le cache des étudiants après création
    invalidateCachePattern('students-*')
    console.log('[CACHE] Invalidated students cache after creation')

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
