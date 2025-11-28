import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

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
  try {
    const schools = await prisma.school.findMany({ 
      orderBy: { dateCreation: "desc" },
      select: {
        id: true,
        nomEtablissement: true,
        typeEtablissement: true,
        codeEtablissement: true,
        ville: true,
        province: true,
        telephone: true,
        email: true,
        directeurNom: true,
        etatCompte: true,
        dateCreation: true,
        dateFinAbonnement: true
      }
    });
    return NextResponse.json({ schools });
  } catch (e: any) {
    console.error("Error fetching schools:", e);
    return NextResponse.json({ error: "Erreur lors de la récupération des écoles", details: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const check = await requireSuperAdmin(req);
  if ("error" in check) return check.error;
  const { payload } = check as { payload: any };
  try {
    const body = await req.json();
    const { 
      nomEtablissement, typeEtablissement, codeEtablissement, anneeCreation, slogan,
      adresse, ville, province, pays, telephone, email, siteWeb,
      directeurNom, directeurTelephone, directeurEmail,
      secretaireAcademique, comptable, personnelAdministratifTotal,
      rccm, idNat, nif, agrementMinisteriel, dateAgrement,
      cycles, nombreClasses, nombreEleves, nombreEnseignants,
      langueEnseignement, programmes, joursOuverture
    } = body;
    
    // Validation des champs requis
    if (!nomEtablissement || !adresse || !ville || !province || !telephone || !email || !directeurNom || !directeurTelephone) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    
    const school = await prisma.school.create({
      data: { 
        nomEtablissement,
        typeEtablissement: typeEtablissement || "PRIVE",
        codeEtablissement: codeEtablissement || null,
        anneeCreation: anneeCreation ? parseInt(anneeCreation) : null,
        slogan: slogan || null,
        adresse,
        ville,
        province,
        pays: pays || "RDC",
        telephone,
        email,
        siteWeb: siteWeb || null,
        directeurNom,
        directeurTelephone,
        directeurEmail: directeurEmail || null,
        secretaireAcademique: secretaireAcademique || null,
        comptable: comptable || null,
        personnelAdministratifTotal: personnelAdministratifTotal ? parseInt(personnelAdministratifTotal) : null,
        rccm: rccm || null,
        idNat: idNat || null,
        nif: nif || null,
        agrementMinisteriel: agrementMinisteriel || null,
        dateAgrement: dateAgrement ? new Date(dateAgrement) : null,
        cycles: cycles || null,
        nombreClasses: nombreClasses ? parseInt(nombreClasses) : null,
        nombreEleves: nombreEleves ? parseInt(nombreEleves) : null,
        nombreEnseignants: nombreEnseignants ? parseInt(nombreEnseignants) : null,
        langueEnseignement: langueEnseignement || null,
        programmes: programmes || null,
        joursOuverture: joursOuverture || null,
        identifiantInterne: `SCH-${Date.now()}`,
        etatCompte: "EN_ATTENTE",
        creeParId: payload.id
      },
    });
    return NextResponse.json({ school }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Code établissement ou email déjà utilisé" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
