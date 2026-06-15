import { NextRequest, NextResponse } from "next/server"
import { calculateStudentYearBalance } from "@/lib/fees/balance.service"
import { listPaiements } from "@/lib/fees/paiement.service"
import { getStudentFromRequest } from "@/lib/student-auth"

export async function GET(req: NextRequest) {
  const ctx = await getStudentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { studentId, schoolId, yearId } = ctx
  if (!schoolId || !yearId) {
    return NextResponse.json({
      balance: null,
      paiements: [],
      message: "Aucune inscription active pour cette année scolaire",
    })
  }

  try {
    const [balance, paiementsResult] = await Promise.all([
      calculateStudentYearBalance(studentId, yearId, schoolId),
      listPaiements({
        schoolId,
        studentId,
        yearId,
        isAnnule: false,
        page: 1,
        pageSize: 20,
      }),
    ])

    const paiements = paiementsResult.data.map((p) => ({
      id: p.id,
      numeroRecu: p.numeroRecu,
      montant: p.montant,
      devise: p.tarification.devise,
      typeFrais: p.tarification.typeFrais.nom,
      datePaiement: p.datePaiement,
      modePaiement: p.modePaiement,
    }))

    return NextResponse.json({
      balance,
      paiements,
      yearId,
    })
  } catch (error) {
    console.error("Erreur frais élève:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
