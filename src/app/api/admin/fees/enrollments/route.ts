import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

// GET /api/admin/fees/enrollments?yearId=X&q=search
// Recherche d'élèves inscrits pour le formulaire de paiement
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const yearId = searchParams.get("yearId")

    // Trouver l'année scolaire courante si non spécifiée
    let activeYearId: number
    if (yearId) {
      activeYearId = parseInt(yearId)
    } else {
      const currentYear = await prisma.academicYear.findFirst({
        where: { current: true },
        select: { id: true },
      })
      if (!currentYear) {
        return NextResponse.json({ data: [] })
      }
      activeYearId = currentYear.id
    }

    const where: Record<string, unknown> = {
      yearId: activeYearId,
      status: "ACTIVE",
      student: {
        user: { schoolId: user.schoolId },
      },
    }

    // Recherche par nom, prénom ou code
    if (q.trim()) {
      where.student = {
        user: { schoolId: user.schoolId },
        OR: [
          { lastName: { contains: q.trim() } },
          { firstName: { contains: q.trim() } },
          { middleName: { contains: q.trim() } },
          { code: { contains: q.trim() } },
        ],
      }
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            code: true,
          },
        },
        class: { select: { id: true, name: true } },
        year: { select: { id: true, name: true } },
      },
      orderBy: { student: { lastName: "asc" } },
      take: 20,
    })

    const data = enrollments.map((e) => ({
      enrollmentId: e.id,
      studentId: e.student.id,
      studentName: `${e.student.lastName} ${e.student.middleName} ${e.student.firstName}`,
      studentCode: e.student.code,
      classId: e.class.id,
      className: e.class.name,
      yearId: e.year.id,
      yearName: e.year.name,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}
