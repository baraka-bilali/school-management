import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCached } from "@/lib/cache"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const schoolId = decoded.schoolId
    if (!schoolId) return NextResponse.json({ error: "Aucune école associée" }, { status: 403 })

    const cacheKey = `dashboard-stats-v2-school-${schoolId}`

    const result = await getCached(cacheKey, async () => {
      // Génère les 8 derniers mois dynamiquement
      const now = new Date()
      const months = Array.from({ length: 8 }, (_, i) => {
        return new Date(now.getFullYear(), now.getMonth() - 7 + i, 1)
      })
      const monthLabels = months.map(d =>
        d.toLocaleDateString("fr-FR", { month: "short" })
          .replace(".", "")
          .replace(/^\w/, c => c.toUpperCase())
      )

      const [
        studentsCount,
        teachersCount,
        classes,
        genderGroups,
        currentYear,
        monthlyStudents,
        monthlyTeachers,
        monthlyPayments,
      ] = await Promise.all([
        prisma.student.count({ where: { user: { schoolId } } }),
        prisma.teacher.count({ where: { user: { schoolId } } }),
        prisma.class.findMany({
          where: { schoolId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.student.groupBy({
          by: ["gender"],
          where: { user: { schoolId } },
          _count: { gender: true },
        }),
        prisma.academicYear.findFirst({ where: { current: true } }),
        Promise.all(
          months.map(month => {
            const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
            return prisma.student.count({ where: { user: { schoolId, createdAt: { lte: end } } } })
          })
        ),
        Promise.all(
          months.map(month => {
            const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
            return prisma.teacher.count({ where: { user: { schoolId, createdAt: { lte: end } } } })
          })
        ),
        Promise.all(
          months.map(async month => {
            const start = new Date(month.getFullYear(), month.getMonth(), 1)
            const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
            const agg = await prisma.paiement.aggregate({
              where: { schoolId, datePaiement: { gte: start, lte: end }, isAnnule: false },
              _sum: { montant: true },
            })
            return agg._sum.montant || 0
          })
        ),
      ])

      let sectionStats = { Primaire: 0, Secondaire: 0 }
      if (currentYear) {
        const [primaire, secondaire] = await Promise.all([
          prisma.enrollment.count({
            where: { yearId: currentYear.id, status: "ACTIVE", class: { schoolId, section: "Primaire" } },
          }),
          prisma.enrollment.count({
            where: { yearId: currentYear.id, status: "ACTIVE", class: { schoolId, section: "Secondaire" } },
          }),
        ])
        sectionStats = { Primaire: primaire, Secondaire: secondaire }
      }

      const male = genderGroups.find(g => g.gender === "M")?._count.gender || 0
      const female = genderGroups.find(g => g.gender === "F")?._count.gender || 0

      return {
        students: studentsCount,
        teachers: teachersCount,
        classes: classes.length,
        classesData: classes,
        attendance: "94%",
        monthLabels,
        monthlyStudents,
        monthlyTeachers,
        monthlyPayments,
        genderStats: { male, female },
        sectionStats,
      }
    }, 300000)

    return NextResponse.json(result)
  } catch (error) {
    console.error("dashboard-stats error:", error)
    return NextResponse.json({ error: "Erreur serveur", students: 0, teachers: 0, classes: 0 }, { status: 500 })
  }
}
