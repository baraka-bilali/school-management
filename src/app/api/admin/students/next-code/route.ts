import { NextRequest, NextResponse } from "next/server"
import { assertStudentEnrollmentAccess, EnrollmentAccessError } from "@/lib/student-enrollment-access"
import { getNextClassCode } from "@/lib/student-fields"

// GET /api/admin/students/next-code?classId=X&yearId=Y
export async function GET(req: NextRequest) {
  try {
    try {
      await assertStudentEnrollmentAccess(req)
    } catch (e) {
      if (e instanceof EnrollmentAccessError) {
        return NextResponse.json({ error: e.message }, { status: e.status })
      }
      throw e
    }

    const { searchParams } = new URL(req.url)
    const classId = parseInt(searchParams.get("classId") || "")
    const yearIdParam = searchParams.get("yearId")

    if (isNaN(classId)) {
      return NextResponse.json({ error: "classId requis" }, { status: 400 })
    }

    let yearId: number
    if (yearIdParam) {
      yearId = parseInt(yearIdParam)
    } else {
      const { prisma } = await import("@/lib/prisma")
      const currentYear = await prisma.academicYear.findFirst({ where: { current: true } })
      if (!currentYear) {
        return NextResponse.json({ error: "Aucune année académique courante" }, { status: 400 })
      }
      yearId = currentYear.id
    }

    const nextCode = await getNextClassCode(classId, yearId)
    return NextResponse.json({ nextCode })
  } catch (error) {
    console.error("Erreur next-code:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
