import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStudentFromRequest } from "@/lib/student-auth"

export async function GET(req: NextRequest) {
  const ctx = await getStudentFromRequest(req)
  if (!ctx?.classId) {
    return NextResponse.json({ error: "Non autorisé ou classe introuvable" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") || "20")

  try {
    const tasks = await prisma.studentTask.findMany({
      where: {
        classId: ctx.classId,
        schoolId: ctx.schoolId!,
        isActive: true,
      },
      orderBy: { dueAt: "asc" },
      take: limit,
      include: {
        subject: { select: { name: true, color: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    })
    return NextResponse.json({ tasks })
  } catch (error) {
    // Table StudentTask peut ne pas exister si la migration n'a pas encore été appliquée
    console.warn("StudentTask indisponible:", error)
    return NextResponse.json({ tasks: [] })
  }
}
