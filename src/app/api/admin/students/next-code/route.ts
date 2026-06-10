import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

// GET /api/admin/students/next-code?classId=X&yearId=Y
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const { searchParams } = new URL(req.url)
    const classId = parseInt(searchParams.get("classId") || "")
    const yearId = searchParams.get("yearId") ? parseInt(searchParams.get("yearId")!) : undefined

    if (isNaN(classId)) {
      return NextResponse.json({ error: "classId requis" }, { status: 400 })
    }

    // Find all students enrolled in this class (optionally filtered by year)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId,
        ...(yearId ? { yearId } : {}),
      },
      include: {
        student: { select: { code: true } },
      },
    })

    // Extract numeric codes and find max
    let maxCode = 0
    for (const enrollment of enrollments) {
      const code = enrollment.student?.code
      if (code) {
        const num = parseInt(code.replace(/\D/g, ""))
        if (!isNaN(num) && num > maxCode) maxCode = num
      }
    }

    return NextResponse.json({ nextCode: maxCode + 1 })
  } catch (error) {
    console.error("Erreur next-code:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
