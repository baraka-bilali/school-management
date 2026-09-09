import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { invalidateCachePattern } from "@/lib/cache"
import { getNextClassCode, isCodeUsedInClass } from "@/lib/student-fields"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

const ORIGINES = ["PASSAGE", "REDOUBLEMENT", "TRANSFERT", "NOUVEL_ENTRANT"] as const

/** POST /api/admin/students/[id]/enrollments — inscrire un élève existant dans une autre année */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const allowedRoles = ["ADMIN", "DIRECTEUR_ETUDES", "CAISSIER"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const params = await context.params
    const studentId = parseInt(params.id)
    if (Number.isNaN(studentId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const body = await req.json()
    const classId = Number(body.classId)
    const yearId = Number(body.yearId)
    const origine = ORIGINES.includes(body.origine) ? body.origine : "PASSAGE"
    const status = body.status === "PROPOSEE" || body.status === "CONFIRMEE" ? body.status : "ACTIVE"

    if (!classId || Number.isNaN(classId)) {
      return NextResponse.json(
        { error: "La classe est obligatoire", field: "classId" },
        { status: 400 }
      )
    }
    if (!yearId || Number.isNaN(yearId)) {
      return NextResponse.json(
        { error: "L'année académique est obligatoire", field: "yearId" },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        permanentCode: true,
        user: { select: { schoolId: true } },
      },
    })
    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }
    if (
      decoded.schoolId &&
      student.user?.schoolId &&
      student.user.schoolId !== decoded.schoolId
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const schoolId = decoded.schoolId ?? student.user?.schoolId
    if (!schoolId) {
      return NextResponse.json({ error: "Aucune école associée" }, { status: 403 })
    }

    const existingYear = await prisma.enrollment.findUnique({
      where: { studentId_yearId: { studentId, yearId } },
      select: { id: true },
    })
    if (existingYear) {
      return NextResponse.json(
        {
          error: "Cet élève a déjà une inscription pour cette année scolaire",
          field: "yearId",
        },
        { status: 400 }
      )
    }

    const [year, schoolClass] = await Promise.all([
      prisma.academicYear.findUnique({ where: { id: yearId }, select: { id: true } }),
      prisma.class.findFirst({
        where: { id: classId, schoolId },
        select: { id: true },
      }),
    ])
    if (!year) {
      return NextResponse.json(
        { error: "Année académique introuvable", field: "yearId" },
        { status: 400 }
      )
    }
    if (!schoolClass) {
      return NextResponse.json(
        { error: "Classe introuvable", field: "classId" },
        { status: 400 }
      )
    }

    let displayCode = body.code?.trim() ? String(body.code).trim() : ""
    if (!displayCode) {
      displayCode = String(await getNextClassCode(classId, yearId))
    }
    if (await isCodeUsedInClass(classId, yearId, displayCode, studentId)) {
      return NextResponse.json(
        {
          error: `Le code « ${displayCode} » est déjà utilisé dans cette classe pour cette année`,
          field: "code",
        },
        { status: 400 }
      )
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId,
        yearId,
        code: displayCode,
        status,
        origine,
      },
      include: { class: true, year: true },
    })

    invalidateCachePattern("students-*")

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (e: unknown) {
    console.error(e)
    const err = e as { code?: string }
    if (err.code === "P2002") {
      return NextResponse.json(
        {
          error: "Cet élève a déjà une inscription pour cette année scolaire",
          field: "yearId",
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 })
  }
}
