import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { User_role } from "@prisma/client"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

async function requireSuperAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("Cookie") || ""
  const tokenMatch = cookieHeader.match(/token=([^;]+)/)
  if (!tokenMatch) return null
  try {
    const decoded = jwt.verify(tokenMatch[1], JWT_SECRET) as any
    return decoded.role === "SUPER_ADMIN" ? decoded : null
  } catch {
    return null
  }
}

// GET /api/super-admin/schools/[id]/details
// Returns rich school data: admins, students by academic year, subscription info
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdmin(req)
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { id } = await context.params
  const schoolId = parseInt(id)
  if (isNaN(schoolId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 })

  try {
    // All queries run in parallel for maximum speed
    const [school, admins, studentsByYearRaw, totalClasses] = await Promise.all([
      // Extended school info for subscription + legal + config tabs
      prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          adresse: true,
          pays: true,
          rccm: true,
          idNat: true,
          nif: true,
          agrementMinisteriel: true,
          dateAgrement: true,
          langueEnseignement: true,
          programmes: true,
          joursOuverture: true,
          anneeCreation: true,
          slogan: true,
          siteWeb: true,
          dateDebutAbonnement: true,
          dateFinAbonnement: true,
          periodeAbonnement: true,
          planAbonnement: true,
          typePaiement: true,
          montantPaye: true,
        },
      }),

      // Admins/staff: users linked to this school (exclude students + super admins)
      prisma.user.findMany({
        where: {
          schoolId,
          role: { notIn: [User_role.ELEVE, User_role.SUPER_ADMIN] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          nom: true,
          prenom: true,
          telephone: true,
          fonction: true,
          isActive: true,
          dateCreation: true,
        },
        orderBy: { role: "asc" },
      }),

      // Students per academic year via raw SQL (COUNT DISTINCT avoids double-counting)
      prisma.$queryRaw<
        { yearId: number; yearName: string; isCurrent: boolean; count: number }[]
      >`
        SELECT ay.id          AS "yearId",
               ay.name        AS "yearName",
               ay.current     AS "isCurrent",
               COUNT(DISTINCT e."studentId")::int AS count
        FROM   "Enrollment" e
        JOIN   "Class"       c  ON e."classId" = c.id
        JOIN   "AcademicYear" ay ON e."yearId"  = ay.id
        WHERE  c."schoolId" = ${schoolId}
        GROUP  BY ay.id, ay.name, ay.current
        ORDER  BY ay.name DESC
      `,

      // Total classes in this school
      prisma.class.count({ where: { schoolId } }),
    ])

    if (!school) return NextResponse.json({ error: "École non trouvée" }, { status: 404 })

    // Normalize count (BigInt → number) from raw query
    const studentsByYear = studentsByYearRaw.map((y) => ({
      ...y,
      count: Number(y.count),
    }))

    // Total students = current year if available, else max across years
    const currentYear = studentsByYear.find((y) => y.isCurrent)
    const totalStudents = currentYear
      ? currentYear.count
      : studentsByYear.reduce((max, y) => Math.max(max, y.count), 0)

    return NextResponse.json({
      school,
      admins,
      studentsByYear,
      totalClasses,
      totalStudents,
    })
  } catch (error: any) {
    console.error("Error fetching school details:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
