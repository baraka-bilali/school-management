import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase-server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

async function requireSuperAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("Cookie") || req.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/)
  if (!match) return null
  try {
    const decoded = jwt.verify(match[1], JWT_SECRET) as any
    return decoded.role === "SUPER_ADMIN" ? decoded : null
  } catch {
    return null
  }
}

// POST: Résilier l'abonnement d'une école
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin(req)
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { id } = await context.params
    const schoolId = parseInt(id)
    if (isNaN(schoolId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 })

    const existingSchool = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!existingSchool) return NextResponse.json({ error: "École non trouvée" }, { status: 404 })

    if (existingSchool.etatCompte === "SUSPENDU") {
      return NextResponse.json({ error: "L'abonnement de cette école est déjà résilié/suspendu." }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { motif } = body

    const today = new Date()
    today.setHours(23, 59, 59, 999)

    await prisma.school.update({
      where: { id: schoolId },
      data: {
        etatCompte: "SUSPENDU",
        dateFinAbonnement: today,
      },
    })

    const motifTexte = motif ? ` Motif : ${motif}` : ""

    // Notification pour tous les admins de l'école (broadcast via schoolId)
    await prisma.notification.create({
      data: {
        type: "SUBSCRIPTION_CANCELLED",
        message: `⛔ Votre abonnement a été résilié par l'administration.${motifTexte} Pour renouveler, contactez Kelasi 360.`,
        schoolId,
        userId: null,
        targetRole: "SCHOOL_USER_ONLY",
      },
    })

    // Notification pour le super-admin
    await prisma.notification.create({
      data: {
        type: "SUBSCRIPTION_CANCELLED",
        message: `⛔ L'abonnement de l'école "${existingSchool.nomEtablissement}" a été résilié.${motifTexte}`,
        schoolId,
        userId: null,
        targetRole: "SUPER_ADMIN_ONLY",
      },
    })

    // Push Realtime → tous les admins de l'école
    const adminUsers = await prisma.user.findMany({
      where: { schoolId, role: "ADMIN", isActive: true },
      select: { id: true },
    })
    for (const admin of adminUsers) {
      await supabaseAdmin
        .channel(`notifications:user:${admin.id}`)
        .send({
          type: "broadcast",
          event: "new_notification",
          payload: { type: "SUBSCRIPTION_CANCELLED" },
        })
    }

    // Push Realtime → super-admin
    await supabaseAdmin.channel("notifications:super-admin").send({
      type: "broadcast",
      event: "new_notification",
      payload: {
        type: "SUBSCRIPTION_CANCELLED",
        schoolName: existingSchool.nomEtablissement,
      },
    })

    return NextResponse.json({
      success: true,
      message: `L'abonnement de "${existingSchool.nomEtablissement}" a été résilié.`,
    })
  } catch (e: any) {
    console.error("Erreur résiliation:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
