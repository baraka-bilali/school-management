import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { buildTeacherEmail, generatePassword } from "@/lib/generateCredentials"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Construire les filtres
    const where: any = {}
    
    if (q) {
      where.OR = [
        { lastName: { contains: q, mode: 'insensitive' } },
        { middleName: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { specialty: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } }
      ]
    }

    // Compter le total
    const total = await prisma.teacher.count({ where })

    // Récupérer les enseignants avec pagination
    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { lastName: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: true
      }
    })

    return NextResponse.json({
      items: teachers,
      total,
      page,
      pageSize
    })
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
