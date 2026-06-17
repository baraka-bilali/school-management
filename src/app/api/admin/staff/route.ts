import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { buildPersonnelEmailByCode, generatePassword } from "@/lib/generateCredentials"
import { isStaffRole, STAFF_ROLES } from "@/lib/staff-roles"
import { User_role } from "@prisma/client"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

const MANAGER_ROLES = new Set(["ADMIN", "DIRECTEUR_ETUDES"])

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

async function uniquePersonnelEmail(
  firstName: string,
  lastName: string,
  schoolCode: string
): Promise<string> {
  let email = buildPersonnelEmailByCode({ firstName, lastName, schoolCode })
  let suffix = 2
  while (await prisma.user.findUnique({ where: { email } })) {
    email = buildPersonnelEmailByCode({ firstName, lastName, schoolCode, suffix })
    suffix++
    if (suffix > 100) throw new Error("Impossible de générer un email unique")
  }
  return email
}

// GET /api/admin/staff
export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (!MANAGER_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    const where = {
      schoolId: auth.schoolId,
      role: { in: STAFF_ROLES as unknown as User_role[] },
      ...(q
        ? {
            OR: [
              { nom: { contains: q, mode: "insensitive" as const } },
              { prenom: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { fonction: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          name: true,
          role: true,
          telephone: true,
          fonction: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ])

    return NextResponse.json({ items, total, page, pageSize })
  } catch (error) {
    console.error("Erreur GET staff:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/admin/staff
export async function POST(req: NextRequest) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    if (!MANAGER_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const { lastName, middleName, firstName, role, phone, fonction } = body

    if (!lastName?.trim() || !firstName?.trim()) {
      return NextResponse.json({ error: "Nom et prénom obligatoires" }, { status: 400 })
    }
    if (!role || !isStaffRole(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    const email = await (async () => {
      const school = await prisma.school.findUnique({
        where: { id: auth.schoolId },
        select: { codeEtablissement: true, nomEtablissement: true },
      })
      const schoolCode = school?.codeEtablissement || school?.nomEtablissement || "school"
      return uniquePersonnelEmail(firstName.trim(), lastName.trim(), schoolCode)
    })()
    const plaintextPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(plaintextPassword, 10)

    const displayName = [lastName, middleName, firstName]
      .map((s: string) => s?.trim())
      .filter(Boolean)
      .join(" ")

    const user = await prisma.user.create({
      data: {
        name: displayName,
        nom: lastName.trim(),
        prenom: firstName.trim(),
        email,
        password: hashedPassword,
        role: role as User_role,
        schoolId: auth.schoolId,
        telephone: phone?.trim() || null,
        fonction: fonction?.trim() || null,
        temporaryPassword: true,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        name: true,
        role: true,
        telephone: true,
        fonction: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user, plaintextPassword }, { status: 201 })
  } catch (error: unknown) {
    console.error("Erreur POST staff:", error)
    const prismaError = error as { code?: string; message?: string }
    if (prismaError.code === "P2002") {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 })
    }
    const msg = prismaError.message || String(error)
    const isDbEnumError =
      msg.includes("invalid input value for enum") ||
      (msg.includes("User_role") && msg.includes("CAISSIER"))
    const isStalePrismaClient =
      msg.includes("PrismaClientValidationError") ||
      (msg.includes("Invalid value for argument") && msg.includes("role"))

    if (isStalePrismaClient) {
      return NextResponse.json(
        {
          error:
            "Le client Prisma local n'est pas à jour. Exécutez « npx prisma generate » puis redémarrez le serveur.",
        },
        { status: 500 }
      )
    }
    if (isDbEnumError) {
      return NextResponse.json(
        {
          error:
            "Le rôle Caissier n'est pas encore activé en base de données. Exécutez : ALTER TYPE \"User_role\" ADD VALUE IF NOT EXISTS 'CAISSIER'; puis redémarrez le serveur.",
        },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? msg : "Erreur serveur" },
      { status: 500 }
    )
  }
}
