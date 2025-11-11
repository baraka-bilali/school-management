import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

function getTokenFromCookie(req: Request) {
  const cookieHeader = req.headers.get("Cookie") || "";
  return cookieHeader.split(/;\s*/).find((c) => c.startsWith("token="))?.split("=")[1];
}

async function requireSuperAdmin(req: Request) {
  const token = getTokenFromCookie(req);
  if (!token) return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "SUPER_ADMIN") {
      return { error: NextResponse.json({ error: "Accès interdit" }, { status: 403 }) };
    }
    return { payload };
  } catch {
    return { error: NextResponse.json({ error: "Token invalide" }, { status: 401 }) };
  }
}

export async function GET(req: Request) {
  const check = await requireSuperAdmin(req);
  if ("error" in check) return check.error;
  const schools = await (prisma as any).school.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ schools });
}

export async function POST(req: Request) {
  const check = await requireSuperAdmin(req);
  if ("error" in check) return check.error;
  const { payload } = check as { payload: any };
  try {
    const body = await req.json();
    const { name, code, address } = body;
    if (!name || !code) {
      return NextResponse.json({ error: "Nom et code requis" }, { status: 400 });
    }
    const school = await (prisma as any).school.create({
      data: { name, code, address: address || null, createdById: payload.id },
    });
    return NextResponse.json({ school }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Nom ou code déjà utilisé" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
