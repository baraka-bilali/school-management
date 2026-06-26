import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"

const TYPE_LABELS: Record<string, string> = {
  SALAIRE: "Salaire",
  PRIME: "Prime",
  BONUS: "Bonus",
  AVANCE: "Avance",
  AUTRE: "Autre",
}

export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const payments = await prisma.teacherPayment.findMany({
    where: { teacherId: ctx.teacherId, schoolId: ctx.schoolId },
    orderBy: { datePaiement: "desc" },
    take: 100,
  })

  const data = payments.map((p) => ({
    id: p.id,
    montant: p.montant,
    type: p.type,
    typeLabel: TYPE_LABELS[p.type] ?? p.type,
    mois: p.mois,
    description: p.description,
    modePaiement: p.modePaiement,
    reference: p.reference,
    datePaiement: p.datePaiement,
    invoiceNumber: `PAY-${String(p.id).padStart(5, "0")}`,
  }))

  const totals = {
    salaire: data.filter((p) => p.type === "SALAIRE").reduce((s, p) => s + p.montant, 0),
    prime: data.filter((p) => p.type === "PRIME").reduce((s, p) => s + p.montant, 0),
    bonus: data.filter((p) => p.type === "BONUS").reduce((s, p) => s + p.montant, 0),
    avance: data.filter((p) => p.type === "AVANCE").reduce((s, p) => s + p.montant, 0),
    autre: data.filter((p) => p.type === "AUTRE").reduce((s, p) => s + p.montant, 0),
    total: data.reduce((s, p) => s + p.montant, 0),
  }

  return NextResponse.json({ payments: data, totals })
}
