import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { isStaffRole } from "@/lib/staff-roles"

const TYPE_LABELS: Record<string, string> = {
  SALAIRE: "Salaire",
  PRIME: "Prime",
  BONUS: "Bonus",
  AVANCE: "Avance",
  AUTRE: "Autre",
}

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const staffUserId = searchParams.get("userId")
    const mois = searchParams.get("mois")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = { schoolId: user.schoolId }
    if (staffUserId) where.userId = parseInt(staffUserId)
    if (mois) where.mois = mois
    if (type) where.type = type

    const payments = await prisma.staffPayment.findMany({
      where,
      include: {
        user: { select: { id: true, nom: true, prenom: true, name: true, role: true } },
      },
      orderBy: { datePaiement: "desc" },
    })

    const data = payments.map((sp) => ({
      id: sp.id,
      userId: sp.userId,
      staffName: [sp.user.nom, sp.user.prenom].filter(Boolean).join(" ").trim() || sp.user.name,
      role: sp.user.role,
      montant: sp.montant,
      type: sp.type,
      mois: sp.mois,
      description: sp.description,
      modePaiement: sp.modePaiement,
      reference: sp.reference,
      datePaiement: sp.datePaiement,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const body = await req.json()
    const { userId, montant, type, mois, description, modePaiement, reference } = body

    if (!userId || !montant || !mois) {
      return NextResponse.json(
        { error: "userId, montant et mois sont requis" },
        { status: 400 }
      )
    }

    if (montant <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être positif" },
        { status: 400 }
      )
    }

    const staffUser = await prisma.user.findFirst({
      where: { id: parseInt(userId), schoolId: user.schoolId },
    })
    if (!staffUser || !isStaffRole(staffUser.role)) {
      return NextResponse.json({ error: "Membre du personnel introuvable" }, { status: 404 })
    }

    const payment = await prisma.staffPayment.create({
      data: {
        userId: parseInt(userId),
        schoolId: user.schoolId,
        montant: parseFloat(montant),
        type: type || "SALAIRE",
        mois,
        description: description || null,
        modePaiement: modePaiement || "CASH",
        reference: reference || null,
        createdBy: user.id,
      },
    })

    const typeLabel = TYPE_LABELS[payment.type] ?? payment.type
    const invoiceNumber = `STF-${String(payment.id).padStart(5, "0")}`

    await prisma.notification.create({
      data: {
        type: "SYSTEM_MESSAGE",
        message: `Paiement reçu : ${payment.montant} $ (${typeLabel}) — ${mois}. Facture ${invoiceNumber}${reference ? ` · Réf. ${reference}` : ""}`,
        schoolId: user.schoolId,
        userId: staffUser.id,
        targetRole: "SCHOOL_USER_ONLY",
      },
    })

    await getSupabaseAdmin()
      .channel(`payments:staff:${staffUser.id}`)
      .send({
        type: "broadcast",
        event: "payment_received",
        payload: { paymentId: payment.id, montant: payment.montant, invoiceNumber },
      })

    return NextResponse.json({ data: payment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
