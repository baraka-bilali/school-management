import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // plus compatible avec Next.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // Vérifier le token SUPER_ADMIN dans le header Authorization ou cookie
    const authHeader = req.headers.get("Authorization");
    const cookieHeader = req.headers.get("Cookie") || "";
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
    const tokenFromCookie = cookieHeader.split(/;\s*/).find(c=>c.startsWith("token="))?.split("=")[1];
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    } catch {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }
    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    // Validation basique
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email déjà utilisé." },
        { status: 400 }
      );
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    // Empêcher la création de SUPER_ADMIN supplémentaires via cette route
    const chosenRole = role === "SUPER_ADMIN" ? "ADMIN" : (role || "ELEVE");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: chosenRole as any,
      },
    });

    return NextResponse.json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
