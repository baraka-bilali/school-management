import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

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

    // Calculate subscription status for admin users
    let subscriptionExpired = false;
    let daysLeft: number | null = null;

    if (user.school?.dateFinAbonnement) {
      const now = new Date();
      const endDate = new Date(user.school.dateFinAbonnement);
      const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      daysLeft = diff;
      subscriptionExpired = diff < 0 || user.school.etatCompte === "SUSPENDU";
    } else if (user.role !== "SUPER_ADMIN") {
      // No subscription set at all = expired/pending
      subscriptionExpired = user.school?.etatCompte !== "ACTIF";
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      subscription: {
        expired: subscriptionExpired,
        daysLeft,
        etatCompte: user.school?.etatCompte ?? null,
        dateFinAbonnement: user.school?.dateFinAbonnement ?? null,
      }
    });
  } catch (e) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }
}
