import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type TimelineBucket = {
  label: string
  count: number
}

type JwtPayload = {
  userId: number
  role: string
}

function normalizePlan(plan: string | null | undefined) {
  const value = plan?.trim().toUpperCase()

  if (!value) return null
  if (value === "BASIC") return "Basic"
  if (value === "PREMIUM" || value === "PRO") return "Premium"
  if (value === "ENTERPRISE") return "Enterprise"

  return null
}

function getPeriodRange(periodParam: string | null) {
  const now = new Date()
  const period = periodParam === "30" || periodParam === "365" ? periodParam : "7"

  if (period === "365") {
    const start = new Date(now.getFullYear(), 0, 1)
    const previousStart = new Date(now.getFullYear() - 1, 0, 1)
    const previousEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999)

    return {
      period,
      start,
      end: now,
      previousStart,
      previousEnd,
      bucketCount: 12,
    }
  }

  const days = Number(period)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  const previousEnd = new Date(start)
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1)

  const previousStart = new Date(start)
  previousStart.setDate(previousStart.getDate() - days)

  return {
    period,
    start,
    end: now,
    previousStart,
    previousEnd,
    bucketCount: period === "30" ? 6 : 7,
  }
}

function getSchoolEventDate(school: {
  dateDebutAbonnement: Date | null
  dateCreation: Date
  dateInscription: Date
}) {
  return school.dateDebutAbonnement ?? school.dateCreation ?? school.dateInscription
}

function isWithinRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end
}

function calculateChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "100" : "0"
  return (((current - previous) / previous) * 100).toFixed(1)
}

function buildTimeline(
  period: string,
  start: Date,
  end: Date,
  bucketCount: number,
  schools: Array<{ dateDebutAbonnement: Date | null; dateCreation: Date; dateInscription: Date }>
) {
  const buckets: TimelineBucket[] = []

  if (period === "365") {
    for (let index = 0; index < 12; index += 1) {
      const monthStart = new Date(start.getFullYear(), index, 1)
      const monthEnd = new Date(start.getFullYear(), index + 1, 0, 23, 59, 59, 999)
      const count = schools.filter((school) => {
        const eventDate = getSchoolEventDate(school)
        return eventDate >= monthStart && eventDate <= monthEnd && eventDate <= end
      }).length

      buckets.push({
        label: monthStart.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
        count,
      })
    }

    return buckets
  }

  const totalDuration = end.getTime() - start.getTime()
  const bucketDuration = Math.max(1, Math.ceil(totalDuration / bucketCount))

  for (let index = 0; index < bucketCount; index += 1) {
    const bucketStart = new Date(start.getTime() + index * bucketDuration)
    const bucketEnd =
      index === bucketCount - 1
        ? end
        : new Date(start.getTime() + (index + 1) * bucketDuration - 1)

    const count = schools.filter((school) => {
      const eventDate = getSchoolEventDate(school)
      return eventDate >= bucketStart && eventDate <= bucketEnd
    }).length

    buckets.push({
      label:
        period === "7"
          ? bucketStart.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")
          : bucketStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }).replace(".", ""),
      count,
    })
  }

  return buckets
}

export async function GET(request: NextRequest) {
  try {
    // Vérification du token
    const cookieHeader = request.headers.get("cookie")
    const token = cookieHeader?.split("; ").find(row => row.startsWith("token="))?.split("=")[1]

    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const userRole = decoded.role

    // Seuls les SUPER_ADMIN peuvent voir ces stats
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const { period, start, end, previousStart, previousEnd, bucketCount } = getPeriodRange(searchParams.get("period"))

    const [
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      totalTeachers,
      totalStudents,
      totalAdmins,
      totalClasses,
      unreadNotifications,
      schoolsByType,
      schoolsByProvince,
      schoolsForMetrics,
    ] = await Promise.all([
      prisma.school.count(),
      prisma.school.count({ where: { etatCompte: "ACTIF" } }),
      prisma.school.count({ where: { etatCompte: "SUSPENDU" } }),
      prisma.user.count(),
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.class.count(),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.school.groupBy({
        by: ["typeEtablissement"],
        _count: { typeEtablissement: true },
      }),
      prisma.school.groupBy({
        by: ["province"],
        _count: { province: true },
        orderBy: { _count: { province: "desc" } },
        take: 5,
      }),
      prisma.school.findMany({
        select: {
          id: true,
          etatCompte: true,
          planAbonnement: true,
          montantPaye: true,
          dateCreation: true,
          dateInscription: true,
          dateDebutAbonnement: true,
        },
      }),
    ])

    const currentPeriodSchools = schoolsForMetrics.filter((school) =>
      isWithinRange(getSchoolEventDate(school), start, end)
    )
    const previousPeriodSchools = schoolsForMetrics.filter((school) =>
      isWithinRange(getSchoolEventDate(school), previousStart, previousEnd)
    )

    const recentSchools = currentPeriodSchools.length
    const schoolsGrowth = calculateChange(recentSchools, previousPeriodSchools.length)

    const activePlanCounts = schoolsForMetrics.reduce(
      (accumulator, school) => {
        if (school.etatCompte !== "ACTIF") return accumulator

        const normalized = normalizePlan(school.planAbonnement)
        if (!normalized) {
          accumulator.unassigned += 1
          return accumulator
        }

        accumulator[normalized] += 1
        return accumulator
      },
      { Basic: 0, Premium: 0, Enterprise: 0, unassigned: 0 }
    )

    const currentRevenue = currentPeriodSchools.reduce(
      (sum, school) => sum + (school.montantPaye ?? 0),
      0
    )
    const previousRevenue = previousPeriodSchools.reduce(
      (sum, school) => sum + (school.montantPaye ?? 0),
      0
    )
    const totalRecordedRevenue = schoolsForMetrics.reduce(
      (sum, school) => sum + (school.montantPaye ?? 0),
      0
    )

    const subscriptionTimeline = buildTimeline(period, start, end, bucketCount, schoolsForMetrics)
    const maxTimelineCount = subscriptionTimeline.reduce(
      (max, item) => Math.max(max, item.count),
      0
    )

    return NextResponse.json({
      period,
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      totalTeachers,
      totalStudents,
      totalAdmins,
      totalClasses,
      recentSchools,
      schoolsGrowth,
      monthlyRevenue: Number(currentRevenue.toFixed(2)),
      totalRecordedRevenue: Number(totalRecordedRevenue.toFixed(2)),
      revenueChange: calculateChange(currentRevenue, previousRevenue),
      schoolsByType: schoolsByType.map((item: any) => ({
        type: item.typeEtablissement,
        count: item._count.typeEtablissement
      })),
      schoolsByProvince: schoolsByProvince.map((item: any) => ({
        province: item.province,
        count: item._count.province
      })),
      unreadNotifications,
      subscriptionsByPlan: {
        Basic: activePlanCounts.Basic,
        Premium: activePlanCounts.Premium,
        Enterprise: activePlanCounts.Enterprise,
      },
      unassignedSubscriptions: activePlanCounts.unassigned,
      subscriptionTimeline,
      maxTimelineCount,
    })

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des stats:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
