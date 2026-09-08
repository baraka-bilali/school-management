import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { buildPersonnelEmailByCode, generatePassword } from "@/lib/generateCredentials"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

const ADMIN_ROLES = ["ADMIN", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"]

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim()
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20")))

    const where: any = {
      user: { schoolId: auth.schoolId },
    }

    if (q) {
      where.AND = [
        { user: { schoolId: auth.schoolId } },
        {
          OR: [
            { lastName: { contains: q } },
            { firstName: { contains: q } },
            { middleName: { contains: q } },
            { phone: { contains: q } },
            { user: { email: { contains: q } } },
          ],
        },
      ]
      delete where.user
    }

    const [total, parents] = await Promise.all([
      prisma.parent.count({ where }),
      prisma.parent.findMany({
        where,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          lastName: true,
          middleName: true,
          firstName: true,
          phone: true,
          userId: true,
          user: { select: { id: true, email: true, isActive: true } },
          students: {
            select: {
              id: true,
              relationship: true,
              student: {
                select: {
                  id: true,
                  code: true,
                  lastName: true,
                  middleName: true,
                  firstName: true,
                  gender: true,
                },
              },
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      items: parents.map((p) => ({
        ...p,
        childrenCount: p.students.length,
      })),
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error("Erreur liste parents:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId || !ADMIN_ROLES.includes(auth.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const lastName = String(body.lastName || "").trim()
    const firstName = String(body.firstName || "").trim()
    const middleName = body.middleName ? String(body.middleName).trim() : null
    const phone = body.phone ? String(body.phone).trim() : null
    const relationship = body.relationship ? String(body.relationship).trim() : null
    const studentIds: number[] = Array.isArray(body.studentIds)
      ? body.studentIds.map((id: unknown) => parseInt(String(id), 10)).filter((n: number) => !isNaN(n))
      : []

    if (!lastName || !firstName) {
      return NextResponse.json(
        { error: "Nom et prénom sont requis" },
        { status: 400 }
      )
    }

    if (studentIds.length > 0) {
      const validStudents = await prisma.student.count({
        where: {
          id: { in: studentIds },
          user: { schoolId: auth.schoolId },
        },
      })
      if (validStudents !== studentIds.length) {
        return NextResponse.json(
          { error: "Un ou plusieurs élèves sont invalides pour cette école" },
          { status: 400 }
        )
      }
    }

    const school = await prisma.school.findUnique({
      where: { id: auth.schoolId },
      select: { codeEtablissement: true, nomEtablissement: true },
    })
    const schoolCode = school?.codeEtablissement || school?.nomEtablissement || "school"

    let email = buildPersonnelEmailByCode({ firstName, lastName, schoolCode })
    let suffix = 2
    while (await prisma.user.findUnique({ where: { email } })) {
      email = buildPersonnelEmailByCode({ firstName, lastName, schoolCode, suffix })
      suffix++
      if (suffix > 100) break
    }

    const plaintextPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(plaintextPassword, 10)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: `${lastName} ${firstName}`,
          nom: lastName,
          prenom: firstName,
          telephone: phone,
          email,
          password: hashedPassword,
          role: "PARENT",
          schoolId: auth.schoolId,
          temporaryPassword: true,
        },
      })

      const parent = await tx.parent.create({
        data: {
          lastName,
          firstName,
          middleName,
          phone,
          userId: user.id,
          ...(studentIds.length > 0
            ? {
                students: {
                  create: studentIds.map((studentId) => ({
                    studentId,
                    relationship,
                  })),
                },
              }
            : {}),
        },
        include: {
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  code: true,
                  lastName: true,
                  middleName: true,
                  firstName: true,
                },
              },
            },
          },
          user: { select: { id: true, email: true } },
        },
      })

      return { user, parent }
    })

    return NextResponse.json({
      user: { id: result.user.id, email: result.user.email },
      parent: result.parent,
      plaintextPassword,
    })
  } catch (e: any) {
    console.error("Erreur création parent:", e)
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
