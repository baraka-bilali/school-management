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

type StudentLinkInput = {
  studentId: number
  relationship: string | null
  isPrimaryContact: boolean
}

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

function parseStudentLinks(body: any): StudentLinkInput[] | null {
  if (Array.isArray(body.students) && body.students.length > 0) {
    const defaultRelationship = body.relationship
      ? String(body.relationship).trim()
      : null
    return body.students
      .map((item: any) => {
        const studentId = parseInt(String(item?.studentId ?? item?.id ?? ""), 10)
        if (isNaN(studentId)) return null
        const relationship =
          item?.relationship !== undefined && item?.relationship !== null
            ? String(item.relationship).trim() || null
            : defaultRelationship
        return {
          studentId,
          relationship,
          isPrimaryContact: Boolean(item?.isPrimaryContact),
        }
      })
      .filter(Boolean) as StudentLinkInput[]
  }

  if (Array.isArray(body.studentIds)) {
    const relationship = body.relationship ? String(body.relationship).trim() : null
    const defaultPrimary = Boolean(body.isPrimaryContact)
    const primaryMap = new Map<number, boolean>()
    if (body.primaryContactByStudentId && typeof body.primaryContactByStudentId === "object") {
      for (const [key, value] of Object.entries(body.primaryContactByStudentId)) {
        const id = parseInt(String(key), 10)
        if (!isNaN(id)) primaryMap.set(id, Boolean(value))
      }
    }
    return body.studentIds
      .map((id: unknown) => parseInt(String(id), 10))
      .filter((n: number) => !isNaN(n))
      .map((studentId: number) => ({
        studentId,
        relationship,
        isPrimaryContact: primaryMap.has(studentId)
          ? primaryMap.get(studentId)!
          : defaultPrimary,
      }))
  }

  return null
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim()
    const lastNameQ = (searchParams.get("lastName") || "").trim()
    const firstNameQ = (searchParams.get("firstName") || "").trim()
    const phoneQ = (searchParams.get("phone") || "").trim()
    const emailQ = (searchParams.get("email") || "").trim()
    const lookup = searchParams.get("lookup") === "1"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || (lookup ? "20" : "20")))
    )

    const where: any = {
      user: { schoolId: auth.schoolId },
    }

    const orFilters: any[] = []
    if (q) {
      orFilters.push(
        { lastName: { contains: q } },
        { firstName: { contains: q } },
        { middleName: { contains: q } },
        { phone: { contains: q } },
        { user: { email: { contains: q } } }
      )
    }
    if (lastNameQ) orFilters.push({ lastName: { contains: lastNameQ } })
    if (firstNameQ) orFilters.push({ firstName: { contains: firstNameQ } })
    if (phoneQ) orFilters.push({ phone: { contains: phoneQ } })
    if (emailQ) orFilters.push({ user: { email: { contains: emailQ } } })

    if (orFilters.length > 0) {
      where.AND = [
        { user: { schoolId: auth.schoolId } },
        { OR: orFilters },
      ]
      delete where.user
    }

    if (lookup) {
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
            user: { select: { email: true } },
            _count: { select: { students: true } },
          },
        }),
      ])

      return NextResponse.json({
        items: parents.map((p) => {
          const name = [p.lastName, p.middleName, p.firstName]
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim()
          return {
            id: p.id,
            name,
            lastName: p.lastName,
            middleName: p.middleName,
            firstName: p.firstName,
            phone: p.phone,
            email: p.user.email,
            childrenCount: p._count.students,
          }
        }),
        total,
        page,
        pageSize,
      })
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
              isPrimaryContact: true,
              student: {
                select: {
                  id: true,
                  permanentCode: true,
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
        students: p.students.map((link) => ({
          ...link,
          student: {
            ...link.student,
            code: link.student.permanentCode,
          },
        })),
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
    const links = parseStudentLinks(body) || []

    if (!lastName || !firstName) {
      return NextResponse.json(
        { error: "Nom et prénom sont requis" },
        { status: 400 }
      )
    }

    const studentIds = [...new Set(links.map((l) => l.studentId))]
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

    const linkByStudent = new Map(links.map((l) => [l.studentId, l]))

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
                  create: studentIds.map((studentId) => {
                    const link = linkByStudent.get(studentId)
                    return {
                      studentId,
                      relationship: link?.relationship ?? null,
                      isPrimaryContact: link?.isPrimaryContact ?? false,
                    }
                  }),
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
                  permanentCode: true,
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
      parent: {
        ...result.parent,
        students: result.parent.students.map((link) => ({
          ...link,
          student: {
            ...link.student,
            code: link.student.permanentCode,
          },
        })),
      },
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
