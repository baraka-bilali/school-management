import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

const ROLES = ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"]

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const subjects = await prisma.subject.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ subjects })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ROLES)

    const body = await req.json()
    const { name, code, description, color, coefficient, maxWeeklyHours } = body

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "Nom et code requis" }, { status: 400 })
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        color: color || "#4f46e5",
        coefficient: coefficient ? parseFloat(coefficient) : 1,
        maxWeeklyHours: maxWeeklyHours ? parseInt(maxWeeklyHours) : 5,
        schoolId: user.schoolId,
      },
    })

    return NextResponse.json({ subject }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
