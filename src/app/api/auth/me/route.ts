import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { grantWelcomeMonthIfEligible } from "@/lib/school-subscription";
import {
  getSubscriptionDaysLeft,
  isSubscriptionAccessBlocked,
} from "@/lib/subscription-period";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("Cookie") || "";
    const token = cookieHeader.split(/;\s*/).find(c=>c.startsWith("token="))?.split("=")[1];
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Récupérer les informations complètes de l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        canEnrollStudents: true,
        school: {
          select: {
            id: true,
            nomEtablissement: true,
            etatCompte: true,
            dateFinAbonnement: true,
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    let welcomeMonthGranted = false

    // Première ouverture uniquement (évite des requêtes inutiles si déjà ACTIF/SUSPENDU)
    const schoolNeedsWelcome =
      !!user.schoolId &&
      user.role !== "SUPER_ADMIN" &&
      user.school?.etatCompte === "EN_ATTENTE" &&
      !user.school?.dateFinAbonnement

    if (schoolNeedsWelcome && user.schoolId) {
      const welcome = await grantWelcomeMonthIfEligible(user.schoolId)
      if (welcome.granted) {
        welcomeMonthGranted = true
        const refreshed = await prisma.school.findUnique({
          where: { id: user.schoolId },
          select: {
            id: true,
            nomEtablissement: true,
            etatCompte: true,
            dateFinAbonnement: true,
          },
        })
        if (refreshed) {
          ;(user as { school: typeof refreshed | null }).school = refreshed
        }
      }
    }

    const now = new Date()
    let subscriptionExpired = false
    let daysLeft: number | null = null

    if (user.role === "SUPER_ADMIN") {
      subscriptionExpired = false
    } else if (user.school) {
      daysLeft = getSubscriptionDaysLeft(user.school.dateFinAbonnement, now)
      subscriptionExpired = isSubscriptionAccessBlocked(
        user.school.dateFinAbonnement,
        user.school.etatCompte,
        now
      )
    } else {
      subscriptionExpired = true
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        canEnrollStudents: user.canEnrollStudents,
      },
      subscription: {
        expired: subscriptionExpired,
        daysLeft,
        etatCompte: user.school?.etatCompte ?? null,
        dateFinAbonnement: user.school?.dateFinAbonnement ?? null,
        welcomeMonthGranted,
      }
    });
  } catch (e) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }
}
