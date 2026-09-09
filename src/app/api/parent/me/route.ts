import { NextRequest, NextResponse } from "next/server"
import { getParentFromRequest } from "@/lib/parent-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const ctx = await getParentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { parent, schoolId, yearId } = ctx
  const school = parent.user.school

  let yearName: string | null = null
  if (yearId) {
    const year = await prisma.academicYear.findUnique({
      where: { id: yearId },
      select: { name: true },
    })
    yearName = year?.name ?? null
  }

  return NextResponse.json({
    parent: {
      id: parent.id,
      userId: parent.user.id,
      schoolId,
      yearId,
      lastName: parent.lastName,
      middleName: parent.middleName,
      firstName: parent.firstName,
      phone: parent.phone,
      email: parent.user.email,
      school: school?.nomEtablissement,
      schoolPhotoUrl: school?.profilePhotoUrl || school?.logoUrl || null,
      year: yearName,
      children: parent.students.map((link) => ({
        id: link.student.id,
        code: link.student.permanentCode,
        lastName: link.student.lastName,
        middleName: link.student.middleName,
        firstName: link.student.firstName,
        gender: link.student.gender,
        photoUrl: link.student.photoUrl,
        relationship: link.relationship,
      })),
    },
  })
}
