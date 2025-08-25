import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildStudentEmail, generatePassword, normalize } from "@/lib/generateCredentials"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || undefined
  const classId = searchParams.get("classId")
  const yearId = searchParams.get("yearId")
  const sort = searchParams.get("sort") || "name_asc"
  const page = Number(searchParams.get("page") || 1)
  const pageSize = Number(searchParams.get("pageSize") || 10)

  const where: any = {}
  if (q) {
    const qn = normalize(q)
    where.OR = [
      { lastName: { contains: qn, mode: "insensitive" } },
      { middleName: { contains: qn, mode: "insensitive" } },
      { code: { contains: qn, mode: "insensitive" } },
    ]
  }

  if (classId || yearId) {
    where.enrollments = {
      some: {
        ...(classId ? { classId: Number(classId) } : {}),
        ...(yearId ? { yearId: Number(yearId) } : {}),
      },
    }
  }

  const orderBy =
    sort === "name_desc"
      ? [{ lastName: "desc" }, { middleName: "desc" }, { firstName: "desc" }]
      : sort === "class"
      ? [{ enrollments: { _count: "desc" } }]
      : [{ lastName: "asc" }, { middleName: "asc" }, { firstName: "asc" }]

  const [total, items] = await prisma.$transaction([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy,
      include: {
        enrollments: {
          include: { class: true, year: true },
          orderBy: { id: "desc" },
          take: 1,
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return NextResponse.json({ total, items, page, pageSize })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
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

    if (!lastName || !middleName || !firstName || !gender || !birthDate || !code || !classId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate unique student code early
    const existingCode = await prisma.student.findUnique({ where: { code } })
    if (existingCode) {
      return NextResponse.json(
        { error: "Code élève déjà utilisé." },
        { status: 400 }
      )
    }

    const year = academicYearId
      ? await prisma.academicYear.findUnique({ where: { id: Number(academicYearId) } })
      : await prisma.academicYear.findFirst({ where: { current: true } })

    if (!year) {
      return NextResponse.json(
        { error: "Aucune année académique courante configurée." },
        { status: 400 }
      )
    }

    const baseEmail = buildStudentEmail({ lastName, middleName, code })

    // ensure unique email
    let email = baseEmail
    let counter = 1
    while (await prisma.user.findUnique({ where: { email } })) {
      const [local, domain] = baseEmail.split("@")
      email = `${local}${counter}@${domain}`
      counter += 1
    }

    const password = generatePassword()
    const hashed = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: `${firstName} ${lastName}`.trim(), email, password: hashed, role: "ELEVE" },
      })

      const student = await tx.student.create({
        data: {
          userId: user.id,
          code,
          lastName,
          middleName,
          firstName,
          gender,
          birthDate: new Date(birthDate),
        },
      })

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          classId: Number(classId),
          yearId: year.id,
          status: "ACTIVE",
        },
        include: { class: true, year: true },
      })

      return { user, student, enrollment }
    })

    return NextResponse.json({ ...result, plaintextPassword: password })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}


