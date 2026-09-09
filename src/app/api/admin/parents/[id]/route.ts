import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

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

function parseStudentLinks(body: any): StudentLinkInput[] | undefined {
  if (Array.isArray(body.students)) {
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
    const relationship =
      body.relationship !== undefined
        ? body.relationship
          ? String(body.relationship).trim()
          : null
        : null
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

  return undefined
}

async function getParentInSchool(parentId: number, schoolId: number) {
  return prisma.parent.findFirst({
    where: { id: parentId, user: { schoolId } },
    include: {
      user: { select: { id: true, email: true, schoolId: true } },
      students: {
        include: {
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
  })
}

function serializeParent(
  parent: NonNullable<Awaited<ReturnType<typeof getParentInSchool>>>
) {
  return {
    ...parent,
    childrenCount: parent.students.length,
    students: parent.students.map((link) => ({
      ...link,
      student: {
        ...link.student,
        code: link.student.permanentCode,
      },
    })),
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const parentId = parseInt((await context.params).id, 10)
    if (isNaN(parentId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const parent = await getParentInSchool(parentId, auth.schoolId)
    if (!parent) {
      return NextResponse.json({ error: "Parent introuvable" }, { status: 404 })
    }

    return NextResponse.json({ parent: serializeParent(parent) })
  } catch (error) {
    console.error("Erreur détail parent:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId || !ADMIN_ROLES.includes(auth.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const parentId = parseInt((await context.params).id, 10)
    if (isNaN(parentId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const existing = await getParentInSchool(parentId, auth.schoolId)
    if (!existing) {
      return NextResponse.json({ error: "Parent introuvable" }, { status: 404 })
    }

    const body = await req.json()
    const lastName = String(body.lastName || "").trim().toUpperCase()
    const firstName = String(body.firstName || "").trim().toUpperCase()
    const middleName =
      body.middleName !== undefined
        ? body.middleName
          ? String(body.middleName).trim().toUpperCase()
          : null
        : undefined
    const phone =
      body.phone !== undefined
        ? body.phone
          ? String(body.phone).trim()
          : null
        : undefined

    if (!lastName || !firstName) {
      return NextResponse.json(
        { error: "Nom et prénom sont requis" },
        { status: 400 }
      )
    }

    const links = parseStudentLinks(body)

    if (links) {
      const uniqueIds = [...new Set(links.map((l) => l.studentId))]
      const linkByStudent = new Map(links.map((l) => [l.studentId, l]))
      const validStudents = await prisma.student.count({
        where: {
          id: { in: uniqueIds },
          user: { schoolId: auth.schoolId },
        },
      })
      if (validStudents !== uniqueIds.length) {
        return NextResponse.json(
          { error: "Un ou plusieurs élèves sont invalides pour cette école" },
          { status: 400 }
        )
      }

      await prisma.$transaction(async (tx) => {
        await tx.parent.update({
          where: { id: parentId },
          data: {
            lastName,
            firstName,
            ...(middleName !== undefined ? { middleName } : {}),
            ...(phone !== undefined ? { phone } : {}),
          },
        })

        await tx.user.update({
          where: { id: existing.userId },
          data: {
            name: `${lastName} ${firstName}`,
            nom: lastName,
            prenom: firstName,
            ...(phone !== undefined ? { telephone: phone } : {}),
          },
        })

        await tx.parentStudent.deleteMany({ where: { parentId } })
        if (uniqueIds.length > 0) {
          await tx.parentStudent.createMany({
            data: uniqueIds.map((studentId) => {
              const link = linkByStudent.get(studentId)
              return {
                parentId,
                studentId,
                relationship: link?.relationship ?? null,
                isPrimaryContact: link?.isPrimaryContact ?? false,
              }
            }),
          })
        }
      })
    } else {
      await prisma.$transaction([
        prisma.parent.update({
          where: { id: parentId },
          data: {
            lastName,
            firstName,
            ...(middleName !== undefined ? { middleName } : {}),
            ...(phone !== undefined ? { phone } : {}),
          },
        }),
        prisma.user.update({
          where: { id: existing.userId },
          data: {
            name: `${lastName} ${firstName}`,
            nom: lastName,
            prenom: firstName,
            ...(phone !== undefined ? { telephone: phone } : {}),
          },
        }),
      ])
    }

    const parent = await getParentInSchool(parentId, auth.schoolId)
    return NextResponse.json({ parent: parent ? serializeParent(parent) : parent })
  } catch (error) {
    console.error("Erreur mise à jour parent:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const parentId = parseInt((await context.params).id, 10)
    if (isNaN(parentId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const existing = await getParentInSchool(parentId, auth.schoolId)
    if (!existing) {
      return NextResponse.json({ error: "Parent introuvable" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.parentStudent.deleteMany({ where: { parentId } })
      await tx.parent.delete({ where: { id: parentId } })
      await tx.user.delete({ where: { id: existing.userId } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression parent:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
