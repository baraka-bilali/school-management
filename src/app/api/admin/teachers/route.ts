import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { buildTeacherEmail, generatePassword } from "@/lib/generateCredentials"
import { getCached, invalidateCachePattern } from "@/lib/cache"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Construire les filtres
    const where: any = {}
    
    if (q) {
      // IMPORTANT: MySQL ne supporte pas mode: 'insensitive' dans Prisma
      // La collation MySQL utf8mb4_general_ci gère l'insensibilité à la casse automatiquement
      const searchTerm = q.trim()
      where.OR = [
        { lastName: { contains: searchTerm } },
        { middleName: { contains: searchTerm } },
        { firstName: { contains: searchTerm } },
        { specialty: { contains: searchTerm } },
        { phone: { contains: searchTerm } }
      ]
    }

    // Cache key basé sur les paramètres de recherche
    const cacheKey = `teachers-${q || 'all'}-${page}-${pageSize}`

    // Utiliser le cache pour réduire les requêtes à la base de données
    const result = await getCached(cacheKey, async () => {
      // Compter le total
      const total = await prisma.teacher.count({ where })

      // Récupérer les enseignants avec pagination
      // Optimisation: Utiliser select au lieu de include pour réduire la taille des données
      const teachers = await prisma.teacher.findMany({
        where,
        orderBy: { lastName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          lastName: true,
          middleName: true,
          firstName: true,
          gender: true,
          birthDate: true,
          specialty: true,
          phone: true,
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      })

      return {
        items: teachers,
        total,
        page,
        pageSize
      }
    }, 300000) // Cache de 5 minutes

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la récupération des enseignants:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { lastName, middleName, firstName, gender, birthDate, specialty, phone } = body

    // Générer email unique avec suffixe si nécessaire
    let email = buildTeacherEmail({ lastName, middleName })
    let suffix = 1
    
    while (true) {
      try {
        await prisma.user.findUnique({ where: { email } })
        break // Email unique trouvé
      } catch {
        // Email existe déjà, essayer avec un suffixe
        email = buildTeacherEmail({ lastName, middleName, suffix: suffix.toString() })
        suffix++
        if (suffix > 100) break // Éviter la boucle infinie
      }
    }

    const plaintextPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(plaintextPassword, 10)

    const user = await prisma.user.create({
      data: {
        name: `${lastName} ${firstName}`,
        email,
        password: hashedPassword,
        role: "PROFESSEUR",
      },
    })

    const teacher = await prisma.teacher.create({
      data: {
        lastName,
        middleName,
        firstName,
        gender,
        birthDate: new Date(birthDate),
        specialty,
        phone,
        userId: user.id,
      },
    })

    // Invalider le cache des enseignants après création
    console.log('[CACHE-INVALIDATE] Invalidating teachers-* cache after creation')
    invalidateCachePattern('teachers-*')

    return NextResponse.json({ user, teacher, plaintextPassword })
  } catch (e: any) {
    console.error(e)
    if (e.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email déjà utilisé' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
