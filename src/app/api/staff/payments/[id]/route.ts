import { NextRequest, NextResponse } from "next/server"
import { getStaffFromRequest } from "@/lib/staff-auth"
import { prisma } from "@/lib/prisma"

const TYPE_LABELS: Record<string, string> = {
  SALAIRE: "Salaire",
  PRIME: "Prime",
  BONUS: "Bonus",
  AVANCE: "Avance",
  AUTRE: "Autre",
}

const MODE_LABELS: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  VIREMENT: "Virement bancaire",
  CHEQUE: "Chèque",
  AUTRE: "Autre",
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getStaffFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const paymentId = parseInt(id)

  const payment = await prisma.staffPayment.findFirst({
    where: { id: paymentId, userId: ctx.userId, schoolId: ctx.schoolId },
  })

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })
  }

  const school = await prisma.school.findUnique({
    where: { id: ctx.schoolId },
    select: { nomEtablissement: true, adresse: true, telephone: true, email: true },
  })

  const staffName = [ctx.user.nom, ctx.user.prenom].filter(Boolean).join(" ").trim() || ctx.user.name

  return NextResponse.json({
    invoice: {
      invoiceNumber: `STF-${String(payment.id).padStart(5, "0")}`,
      montant: payment.montant,
      devise: "USD",
      type: payment.type,
      typeLabel: TYPE_LABELS[payment.type] ?? payment.type,
      mois: payment.mois,
      description: payment.description,
      modePaiement: payment.modePaiement,
      modeLabel: MODE_LABELS[payment.modePaiement] ?? payment.modePaiement,
      reference: payment.reference,
      datePaiement: payment.datePaiement,
      staffName,
      roleLabel: ctx.roleLabel,
      schoolName: school?.nomEtablissement,
      schoolAddress: school?.adresse,
      schoolPhone: school?.telephone,
      schoolEmail: school?.email,
    },
  })
}
