import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getSchoolCurrentYearId } from "@/lib/fees/api-helpers"
import {
  isCodeUsedInClass,
  normalizeStudentIdentity,
  normalizeStudentProfile,
  studentWithDisplayCode,
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

    const requiredFields = ["lastName", "middleName", "firstName", "gender", "birthDate"] as const
    for (const field of requiredFields) {
      const value = field === "lastName" || field === "middleName" || field === "firstName"
        ? identity[field]
        : data[field]
      if (!value) {
        return NextResponse.json({ error: `Le champ ${field} est requis` }, { status: 400 })
      }
    }

    const displayCode = data.code != null ? String(data.code).trim() : ""

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
      select: { id: true, classId: true, yearId: true },
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

    const profileFields = normalizeStudentProfile(data)

    // 1. Save core identity fields (permanentCode never recalculated)
    await prisma.student.update({
      where: { id: studentId },
      data: {
        lastName: identity.lastName,
        middleName: identity.middleName,
        firstName: identity.firstName,
        gender: data.gender,
        birthDate: new Date(data.birthDate),
      },
    })

    // Update class display code on current enrollment
    if (currentEnrollment && displayCode) {
      await prisma.enrollment.update({
        where: { id: currentEnrollment.id },
        data: { code: displayCode },
      })
    }

    // 2. Save extended fields via Prisma
    try {
      await prisma.student.update({
        where: { id: studentId },
        data: {
          birthPlace: data.birthPlace !== undefined ? (profileFields.birthPlace ?? null) : undefined,
          nationality: data.nationality !== undefined ? (profileFields.nationality ?? null) : undefined,
          address: data.address !== undefined ? (profileFields.address ?? null) : undefined,
          photoUrl: data.photoUrl !== undefined ? data.photoUrl ?? null : undefined,
          parentName1: data.parentName1 !== undefined ? (profileFields.parentName1 ?? null) : undefined,
          parentPhone1: data.parentPhone1 !== undefined ? data.parentPhone1 ?? null : undefined,
          parentJob1: data.parentJob1 !== undefined ? (profileFields.parentJob1 ?? null) : undefined,
          parentEmail1: data.parentEmail1 !== undefined ? data.parentEmail1 ?? null : undefined,
          parentName2: data.parentName2 !== undefined ? (profileFields.parentName2 ?? null) : undefined,
          parentPhone2: data.parentPhone2 !== undefined ? data.parentPhone2 ?? null : undefined,
          parentJob2: data.parentJob2 !== undefined ? (profileFields.parentJob2 ?? null) : undefined,
          parentEmail2: data.parentEmail2 !== undefined ? data.parentEmail2 ?? null : undefined,
          bloodGroup: data.bloodGroup !== undefined ? data.bloodGroup ?? null : undefined,
          allergies: data.allergies !== undefined ? (profileFields.allergies ?? null) : undefined,
          medicalNotes: data.medicalNotes !== undefined ? (profileFields.medicalNotes ?? null) : undefined,
          emergencyContact:
            data.emergencyContact !== undefined ? (profileFields.emergencyContact ?? null) : undefined,
          emergencyPhone: data.emergencyPhone !== undefined ? data.emergencyPhone ?? null : undefined,
        },
      })
    } catch {
      // Extended fields optional
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

    // Mise à jour de la classe / inscription (une seule inscription par année)
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

      const existingForYear = await prisma.enrollment.findUnique({
        where: { studentId_yearId: { studentId, yearId } },
      })

      const latestEnrollment = updatedStudent.enrollments[0]

      if (existingForYear) {
        await prisma.enrollment.update({
          where: { id: existingForYear.id },
          data: {
            classId: targetClassId,
            ...(displayCode ? { code: displayCode } : {}),
            ...(existingForYear.status !== "ACTIVE" ? { status: "ACTIVE" } : {}),
          },
        })
      } else if (latestEnrollment && latestEnrollment.yearId !== yearId) {
        await prisma.enrollment.create({
          data: {
            studentId,
            classId: targetClassId,
            yearId,
            code: displayCode || null,
            status: "ACTIVE",
            origine: "PASSAGE",
          },
        })
      } else if (latestEnrollment) {
        await prisma.enrollment.update({
          where: { id: latestEnrollment.id },
          data: {
            classId: targetClassId,
            yearId,
            ...(displayCode ? { code: displayCode } : {}),
          },
        })
      } else {
        await prisma.enrollment.create({
          data: {
            studentId,
            classId: targetClassId,
            yearId,
            code: displayCode || null,
            status: "ACTIVE",
            origine: "NOUVEL_ENTRANT",
          },
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