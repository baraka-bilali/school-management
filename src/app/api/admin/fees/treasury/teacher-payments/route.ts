import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { supabaseAdmin } from "@/lib/supabase-server"

const TYPE_LABELS: Record<string, string> = {
  SALAIRE: "Salaire",
  PRIME: "Prime",
  BONUS: "Bonus",
  AVANCE: "Avance",
  AUTRE: "Autre",
}

// GET /api/admin/fees/treasury/teacher-payments — Liste paiements profs
// POST — Créer un paiement prof
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")
    const mois = searchParams.get("mois")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = { schoolId: user.schoolId }
    if (teacherId) where.teacherId = parseInt(teacherId)
    if (mois) where.mois = mois
    if (type) where.type = type

    const payments = await prisma.teacherPayment.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, lastName: true, middleName: true, firstName: true, specialty: true },
        },
      },
      orderBy: { datePaiement: "desc" },
    })

    const data = payments.map((tp) => ({
      id: tp.id,
      teacherId: tp.teacherId,
      teacherName: `${tp.teacher.lastName} ${tp.teacher.middleName} ${tp.teacher.firstName}`,
      specialty: tp.teacher.specialty,
      montant: tp.montant,
      type: tp.type,
      mois: tp.mois,
      description: tp.description,
      modePaiement: tp.modePaiement,
      reference: tp.reference,
      datePaiement: tp.datePaiement,
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
    const { teacherId, montant, type, mois, description, modePaiement, reference } = body

    if (!teacherId || !montant || !mois) {
      return NextResponse.json(
        { error: "teacherId, montant et mois sont requis" },
        { status: 400 }
      )
    }

    if (montant <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être positif" },
        { status: 400 }
      )
    }

    // Vérifier que le prof appartient à l'école
    const teacher = await prisma.teacher.findFirst({
      where: { id: parseInt(teacherId), user: { schoolId: user.schoolId } },
      include: { user: { select: { id: true } } },
    })
    if (!teacher) {
      return NextResponse.json({ error: "Professeur introuvable" }, { status: 404 })
    }

    const payment = await prisma.teacherPayment.create({
      data: {
        teacherId: parseInt(teacherId),
        schoolId: user.schoolId,
        montant: parseFloat(montant),
        type: type || "SALAIRE",
        mois,
        description: description || null,
        modePaiement: modePaiement || "CASH",
        reference: reference || null,
        createdBy: user.id,
      },
      include: {
        teacher: {
          select: { lastName: true, middleName: true, firstName: true },
        },
      },
    })

    const typeLabel = TYPE_LABELS[payment.type] ?? payment.type
    const invoiceNumber = `PAY-${String(payment.id).padStart(5, "0")}`

    await prisma.notification.create({
      data: {
        type: "SYSTEM_MESSAGE",
        message: `Paiement reçu : ${payment.montant} $ (${typeLabel}) — ${mois}. Facture ${invoiceNumber}${reference ? ` · Réf. ${reference}` : ""}`,
        schoolId: user.schoolId,
        userId: teacher.user.id,
        targetRole: "SCHOOL_USER_ONLY",
      },
    })

    await supabaseAdmin
      .channel(`payments:teacher:${teacher.user.id}`)
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
