import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import {
  isCodeUsedInClass,
  normalizeStudentIdentity,
  normalizeStudentProfile,
  studentWithDisplayCode,
  toStoredCode,
} from "@/lib/student-fields"

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

    const enrollment = student.enrollments[0]
    return NextResponse.json({
      student: studentWithDisplayCode(
        student,
        enrollment?.classId,
        enrollment?.yearId
      ),
    })
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

    const identity = normalizeStudentIdentity({
      lastName: data.lastName,
      middleName: data.middleName,
      firstName: data.firstName,
    })

    const requiredFields = ["lastName", "middleName", "firstName", "gender", "birthDate", "code"] as const
    for (const field of requiredFields) {
      const value = field === "lastName" || field === "middleName" || field === "firstName"
        ? identity[field]
        : data[field]
      if (!value) {
        return NextResponse.json({ error: `Le champ ${field} est requis` }, { status: 400 })
      }
    }

    const displayCode = String(data.code).trim()

    // Vérifier appartenance école
    const existing = await prisma.student.findUnique({
      where: { id: studentId },
      select: { user: { select: { schoolId: true } } },
    })
    if (!existing) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    if (decoded.schoolId && existing.user?.schoolId && existing.user.schoolId !== decoded.schoolId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const currentEnrollment = await prisma.enrollment.findFirst({
      where: { studentId },
      orderBy: { year: { startDate: "desc" } },
      select: { classId: true, yearId: true },
    })

    if (currentEnrollment && displayCode) {
      const taken = await isCodeUsedInClass(
        currentEnrollment.classId,
        currentEnrollment.yearId,
        displayCode,
        studentId
      )
      if (taken) {
        return NextResponse.json(
          { error: `Le code « ${displayCode} » est déjà utilisé dans cette classe` },
          { status: 400 }
        )
      }
    }

    const storedCode = currentEnrollment
      ? toStoredCode(currentEnrollment.classId, displayCode, currentEnrollment.yearId)
      : displayCode

    const profileFields = normalizeStudentProfile(data)

    // 1. Save core fields (always exist in DB)
    await prisma.student.update({
      where: { id: studentId },
      data: {
        code: storedCode,
        lastName: identity.lastName,
        middleName: identity.middleName,
        firstName: identity.firstName,
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
        data.birthPlace       !== undefined ? (profileFields.birthPlace ?? null) : null,
        data.nationality      !== undefined ? (profileFields.nationality ?? null) : null,
        data.address          !== undefined ? (profileFields.address ?? null) : null,
        data.photoUrl         ?? null,
        data.parentName1      !== undefined ? (profileFields.parentName1 ?? null) : null,
        data.parentPhone1     ?? null,
        data.parentJob1       !== undefined ? (profileFields.parentJob1 ?? null) : null,
        data.parentEmail1     ?? null,
        data.parentName2      !== undefined ? (profileFields.parentName2 ?? null) : null,
        data.parentPhone2     ?? null,
        data.parentJob2       !== undefined ? (profileFields.parentJob2 ?? null) : null,
        data.parentEmail2     ?? null,
        data.bloodGroup       ?? null,
        data.allergies        !== undefined ? (profileFields.allergies ?? null) : null,
        data.medicalNotes     !== undefined ? (profileFields.medicalNotes ?? null) : null,
        data.emergencyContact !== undefined ? (profileFields.emergencyContact ?? null) : null,
        data.emergencyPhone   ?? null,
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

    // Mise à jour de la classe / inscription (plusieurs années possibles)
    if (data.classId && updatedStudent) {
      const targetClassId = Number(data.classId)
      let yearId = data.yearId ? Number(data.yearId) : undefined
      if (!yearId) {
        const yId = await getSchoolCurrentYearId(decoded.schoolId || 0)
        if (!yId) {
          return NextResponse.json({ error: "Aucune année académique active" }, { status: 400 })
        }
        yearId = yId
      }

      const existingForTarget = await prisma.enrollment.findFirst({
        where: { studentId, classId: targetClassId, yearId },
      })

      const currentEnrollment = updatedStudent.enrollments[0]

      if (existingForTarget) {
        if (existingForTarget.status !== "ACTIVE") {
          await prisma.enrollment.update({
            where: { id: existingForTarget.id },
            data: { status: "ACTIVE" },
          })
        }
      } else if (currentEnrollment && currentEnrollment.yearId !== yearId) {
        await prisma.enrollment.create({
          data: { studentId, classId: targetClassId, yearId, status: "ACTIVE" },
        })
      } else if (currentEnrollment) {
        await prisma.enrollment.update({
          where: { id: currentEnrollment.id },
          data: { classId: targetClassId, yearId },
        })
      } else {
        await prisma.enrollment.create({
          data: { studentId, classId: targetClassId, yearId, status: "ACTIVE" },
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

    const enrollment = responseStudent?.enrollments[0]
    return NextResponse.json({
      student: responseStudent
        ? studentWithDisplayCode(
            responseStudent,
            enrollment?.classId,
            enrollment?.yearId
          )
        : null,
    })
  } catch (error) {
    console.error("Erreur mise à jour élève:", error)
    return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 })
  }
}