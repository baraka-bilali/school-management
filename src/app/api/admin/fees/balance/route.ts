import { NextRequest, NextResponse } from "next/server"
import { calculateBalance, calculateStudentYearBalance } from "@/lib/fees"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

// GET /api/admin/fees/balance?studentId=X&tarificationId=Y
// GET /api/admin/fees/balance?studentId=X&yearId=Y  (solde global année)
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    const tarificationId = searchParams.get("tarificationId")
    const yearId = searchParams.get("yearId")

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId est requis" },
        { status: 400 }
      )
    }

    // Solde pour une tarification spécifique
    if (tarificationId) {
      const balance = await calculateBalance(
        parseInt(studentId),
        parseInt(tarificationId)
      )
      return NextResponse.json({ data: balance })
    }

    // Solde global pour une année scolaire
    if (yearId) {
      const balance = await calculateStudentYearBalance(
        parseInt(studentId),
        parseInt(yearId),
        user.schoolId
      )
      return NextResponse.json({ data: balance })
    }

    return NextResponse.json(
      { error: "tarificationId ou yearId est requis" },
      { status: 400 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
