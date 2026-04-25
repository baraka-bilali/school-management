import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getSchoolCurrentYearId } from "@/lib/fees/api-helpers"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

// GET /api/admin/students/[id]
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const allowedRoles = ["ADMIN", "COMPTABLE", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const params = await context.params
    const studentId = parseInt(params.id)
    if (isNaN(studentId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 })

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            email: true,
            telephone: true,
            nom: true,
            prenom: true,
            isActive: true,
            schoolId: true,
            school: { select: { nomEtablissement: true } },
          },
        },
        enrollments: {
          include: { class: true, year: true },
          orderBy: { year: { startDate: "desc" } },
          take: 1,
        },
      },
    })

    if (!student) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })

    if (decoded.schoolId && student.user?.schoolId && student.user.schoolId !== decoded.schoolId) {
      return NextResponse.json({ error: "Accès refusé à cet élève" }, { status: 403 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error("Erreur récupération élève:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT /api/admin/students/[id]
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const allowedRoles = ["ADMIN", "DIRECTEUR_DISCIPLINE", "DIRECTEUR_ETUDES"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const params = await context.params
    const studentId = parseInt(params.id)
    if (isNaN(studentId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 })

    const data = await req.json()

    const requiredFields = ["lastName", "middleName", "firstName", "gender", "birthDate", "code"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Le champ ${field} est requis` }, { status: 400 })
      }
    }

    // Vérifier appartenance école
    const existing = await prisma.student.findUnique({
      where: { id: studentId },
      select: { user: { select: { schoolId: true } } },
    })
    if (!existing) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    if (decoded.schoolId && existing.user?.schoolId && existing.user.schoolId !== decoded.schoolId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // 1. Save core fields (always exist in DB)
    await prisma.student.update({
      where: { id: studentId },
      data: {
        code: data.code,
        lastName: data.lastName,
        middleName: data.middleName,
        firstName: data.firstName,
        gender: data.gender,
        birthDate: new Date(data.birthDate),
      },
    })

    // 2. Save extended fields via raw SQL — silently ignored if columns don't exist yet
    // Run manual-migration-student-extended.sql in Supabase to enable these fields.
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "Student" SET
          "birthPlace"       = $1,
          "nationality"      = $2,
          "address"          = $3,
          "photoUrl"         = $4,
          "parentName1"      = $5,
          "parentPhone1"     = $6,
          "parentJob1"       = $7,
          "parentEmail1"     = $8,
          "parentName2"      = $9,
          "parentPhone2"     = $10,
          "parentJob2"       = $11,
          "parentEmail2"     = $12,
          "bloodGroup"       = $13,
          "allergies"        = $14,
          "medicalNotes"     = $15,
          "emergencyContact" = $16,
          "emergencyPhone"   = $17
        WHERE id = $18
      `,
        data.birthPlace       || null,
        data.nationality      || null,
        data.address          || null,
        data.photoUrl         || null,
        data.parentName1      || null,
        data.parentPhone1     || null,
        data.parentJob1       || null,
        data.parentEmail1     || null,
        data.parentName2      || null,
        data.parentPhone2     || null,
        data.parentJob2       || null,
        data.parentEmail2     || null,
        data.bloodGroup       || null,
        data.allergies        || null,
        data.medicalNotes     || null,
        data.emergencyContact || null,
        data.emergencyPhone   || null,
        studentId,
      )
    } catch {
      // Extended columns not yet in DB — base fields were already saved above
    }

    // 3. Fetch current enrollment state before optional class change
    const updatedStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: { class: true, year: true },
          orderBy: { year: { startDate: "desc" } },
          take: 1,
        },
      },
    })

    // Mise à jour de la classe si spécifiée
    if (data.classId) {
      const currentEnrollment = updatedStudent.enrollments[0]
      let yearId = data.yearId ? Number(data.yearId) : undefined
      if (!yearId) {
        const yId = await getSchoolCurrentYearId(decoded.schoolId || 0)
        if (!yId) {
          return NextResponse.json({ error: "Aucune année académique active" }, { status: 400 })
        }
        yearId = yId
      }
      if (currentEnrollment) {
        await prisma.enrollment.update({
          where: { id: currentEnrollment.id },
          data: { classId: Number(data.classId), yearId },
        })
      } else {
        await prisma.enrollment.create({
          data: { studentId, classId: Number(data.classId), yearId },
        })
      }
    }

    const responseStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            email: true,
            telephone: true,
            nom: true,
            prenom: true,
            isActive: true,
            schoolId: true,
            school: { select: { nomEtablissement: true } },
          },
        },
        enrollments: {
          include: { class: true, year: true },
          orderBy: { year: { startDate: "desc" } },
          take: 1,
        },
      },
    })

    return NextResponse.json({ student: responseStudent })
  } catch (error) {
    console.error("Erreur mise à jour élève:", error)
    return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 })
  }
}