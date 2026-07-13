import { NextRequest, NextResponse } from "next/server"
import { getStaffFromRequest } from "@/lib/staff-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const ctx = await getStaffFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { user, schoolId, yearId } = ctx

  let yearName: string | null = null
  if (yearId) {
    const year = await prisma.academicYear.findUnique({
      where: { id: yearId },
      select: { name: true },
    })
    yearName = year?.name ?? null
  }

  return NextResponse.json({
    staff: {
      userId: user.id,
      schoolId,
      yearId,
      lastName: user.nom || "",
      middleName: null,
      firstName: user.prenom || user.name?.split(" ")[0] || "",
      phone: user.telephone,
      email: user.email,
      role: user.role,
      roleLabel: ctx.roleLabel,
      school: user.school?.nomEtablissement,
      schoolPhotoUrl: user.school?.profilePhotoUrl || user.school?.logoUrl || null,
      year: yearName,
    },
  })
}
