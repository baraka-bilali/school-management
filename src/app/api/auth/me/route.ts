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
      select: { id: true, name: true, email: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }
}
