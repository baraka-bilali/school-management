import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"; // mets une vraie clé secrète en prod

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    console.log("Login attempt for:", email);

    if (!email || !password) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    console.log("User found:", user ? `${user.email} (${user.role})` : "none");
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
    }

    // Générer un token JWT avec schoolId
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        schoolId: user.schoolId,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Définir un cookie HttpOnly pour être lisible par le middleware côté serveur
    const res = NextResponse.json({ 
      message: "Connexion réussie", 
      token,
      temporaryPassword: user.temporaryPassword || false, // Indiquer si le mot de passe est temporaire
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom
      }
    });
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 // 1h
    });
    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      error: "Une erreur est survenue", 
      details: process.env.NODE_ENV === "development" ? error.message : undefined 
    }, { status: 500 });
  }
}
