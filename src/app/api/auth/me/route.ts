import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("Cookie") || "";
    const token = cookieHeader.split(/;\s*/).find(c=>c.startsWith("token="))?.split("=")[1];
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return NextResponse.json({ user: { id: decoded.id, email: decoded.email, role: decoded.role } });
  } catch (e) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }
}
