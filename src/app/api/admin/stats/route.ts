import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = {
  userId: number
  role: string
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

    // Statistiques générales
    const totalSchools = await prisma.school.count()
    const activeSchools = await prisma.school.count({
      where: { etatCompte: "ACTIF" }
    })
    const suspendedSchools = await prisma.school.count({
      where: { etatCompte: "SUSPENDU" }
    })

    // Statistiques des utilisateurs
    const totalUsers = await prisma.user.count()
    const totalTeachers = await prisma.user.count({
      where: { role: "PROFESSEUR" }
    })
    const totalStudents = await prisma.user.count({
      where: { role: "ELEVE" }
    })
    const totalAdmins = await prisma.user.count({
      where: { role: "ADMIN" }
    })

    // Statistiques des classes
    const totalClasses = await prisma.class.count()

    // Écoles créées récemment (derniers 7 jours)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentSchools = await prisma.school.count({
      where: {
        dateCreation: {
          gte: sevenDaysAgo
        }
      }
    })

    // Écoles par type
    const schoolsByType = await prisma.school.groupBy({
      by: ['typeEtablissement'],
      _count: {
        typeEtablissement: true
      }
    })

    // Écoles par province (top 5)
    const schoolsByProvince = await prisma.school.groupBy({
      by: ['province'],
      _count: {
        province: true
      },
      orderBy: {
        _count: {
          province: 'desc'
        }
      },
      take: 5
    })

    // Notifications non lues
    const unreadNotifications = await prisma.notification.count({
      where: { isRead: false }
    })

    // Calculer les tendances (comparaison avec période précédente)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    
    const previousPeriodSchools = await prisma.school.count({
      where: {
        dateCreation: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo
        }
      }
    })

    // Calcul du pourcentage de changement
    const schoolsGrowth = previousPeriodSchools > 0 
      ? ((recentSchools - previousPeriodSchools) / previousPeriodSchools * 100).toFixed(1)
      : recentSchools > 0 ? "100" : "0"

    // Abonnements par formule (compter les vraies valeurs depuis la base de données)
    const basicCount = await prisma.school.count({
      where: { 
        etatCompte: "ACTIF",
        OR: [
          { planAbonnement: "basic" },
          { planAbonnement: "Basic" },
          { planAbonnement: "BASIC" },
          { planAbonnement: null } // Considérer les écoles sans plan comme Basic
        ]
      }
    })

    const premiumCount = await prisma.school.count({
      where: { 
        etatCompte: "ACTIF",
        OR: [
          { planAbonnement: "premium" },
          { planAbonnement: "Premium" },
          { planAbonnement: "PREMIUM" },
          { planAbonnement: "pro" } // Certaines écoles utilisent "pro"
        ]
      }
    })

    const enterpriseCount = await prisma.school.count({
      where: { 
        etatCompte: "ACTIF",
        OR: [
          { planAbonnement: "enterprise" },
          { planAbonnement: "Enterprise" },
          { planAbonnement: "ENTERPRISE" }
        ]
      }
    })

    const subscriptionsByPlan = {
      Basic: basicCount,
      Premium: premiumCount,
      Enterprise: enterpriseCount
    }

    // Calcul des revenus mensuels (prix supposés par formule)
    const basicPrice = 49.99  // Prix Basic par mois
    const premiumPrice = 99.99  // Prix Premium par mois
    const enterprisePrice = 199.99  // Prix Enterprise par mois

    const monthlyRevenue = (basicCount * basicPrice) + (premiumCount * premiumPrice) + (enterpriseCount * enterprisePrice)
    
    // Calcul de la variation du revenu (comparaison avec le mois précédent - simulation)
    const previousMonthRevenue = monthlyRevenue * 0.985 // Simulation: -1.5% de variation
    const revenueChange = ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)

    return NextResponse.json({
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
      monthlyRevenue: Math.round(monthlyRevenue),
      revenueChange,
      schoolsByType: schoolsByType.map((item: any) => ({
        type: item.typeEtablissement,
        count: item._count.typeEtablissement
      })),
      schoolsByProvince: schoolsByProvince.map((item: any) => ({
        province: item.province,
        count: item._count.province
      })),
      unreadNotifications,
      subscriptionsByPlan
    })

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des stats:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
