import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

    const token = authHeader.split(" ")[1]; // "Bearer <token>"
    const decoded = jwt.verify(token, JWT_SECRET);

    return NextResponse.json({ message: "Accès autorisé", user: decoded });
  } catch (err) {
    return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
  }
}
