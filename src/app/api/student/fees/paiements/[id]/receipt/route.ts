import { NextRequest, NextResponse } from "next/server"
import { getReceiptData } from "@/lib/fees/receipt.service"
import { getStudentFromRequest } from "@/lib/student-auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = await getStudentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const paiementId = parseInt(id)

  const paiement = await prisma.paiement.findFirst({
    where: {
      id: paiementId,
      studentId: ctx.studentId,
      isAnnule: false,
    },
  })

  if (!paiement) {
    return NextResponse.json({ error: "Reçu introuvable" }, { status: 404 })
  }

  try {
    const data = await getReceiptData(paiementId)
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération du reçu" }, { status: 500 })
  }
}
