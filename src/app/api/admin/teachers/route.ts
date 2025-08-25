import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildTeacherEmail, generatePassword, normalize } from "@/lib/generateCredentials"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || undefined
  const yearId = searchParams.get("yearId")
  const page = Number(searchParams.get("page") || 1)
  const pageSize = Number(searchParams.get("pageSize") || 10)

  const where: any = {}
  if (q) {
    const qn = normalize(q)
    where.OR = [
      { lastName: { contains: qn, mode: "insensitive" } },
      { middleName: { contains: qn, mode: "insensitive" } },
      { firstName: { contains: qn, mode: "insensitive" } },
      { specialty: { contains: qn, mode: "insensitive" } },
      { phone: { contains: qn, mode: "insensitive" } },
    ]
  }

  // If a teacher-year link existed, we would filter here by yearId.
  void yearId

  const [total, items] = await prisma.$transaction([
    prisma.teacher.count({ where }),
    prisma.teacher.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { middleName: "asc" }],
      include: { user: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return NextResponse.json({ total, items, page, pageSize })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lastName, middleName, firstName, gender, birthDate, specialty, phone } = body

    if (!lastName || !middleName || !firstName || !gender || !birthDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const baseEmail = buildTeacherEmail({ lastName, middleName })
    let email = baseEmail
    let counter = 1
    while (await prisma.user.findUnique({ where: { email } })) {
      email = buildTeacherEmail({ lastName, middleName, suffix: String(counter) })
      counter += 1
    }

    const password = generatePassword()
    const hashed = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: `${firstName} ${lastName}`.trim(), email, password: hashed, role: "PROFESSEUR" },
      })

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          lastName,
          middleName,
          firstName,
          gender,
          birthDate: new Date(birthDate),
          specialty,
          phone,
        },
      })

      return { user, teacher }
    })

    return NextResponse.json({ ...result, plaintextPassword: password })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}


