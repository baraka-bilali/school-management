import { NextRequest, NextResponse } from "next/server"
import {
  createPaiement,
  listPaiements,
  createPaiementSchema,
} from "@/lib/fees"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { FEE_COLLECT_ROLES, FEE_VIEW_ROLES } from "@/lib/fees/roles"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase-server"

// GET /api/admin/fees/paiements
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, [...FEE_VIEW_ROLES])

    const { searchParams } = new URL(req.url)

    const result = await listPaiements({
      schoolId: user.schoolId,
      studentId: searchParams.get("studentId")
        ? parseInt(searchParams.get("studentId")!)
        : undefined,
      yearId: searchParams.get("yearId")
        ? parseInt(searchParams.get("yearId")!)
        : undefined,
      classId: searchParams.get("classId")
        ? parseInt(searchParams.get("classId")!)
        : undefined,
      tarificationId: searchParams.get("tarificationId")
        ? parseInt(searchParams.get("tarificationId")!)
        : undefined,
      isAnnule: searchParams.get("isAnnule") !== null
        ? searchParams.get("isAnnule") === "true"
        : undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/admin/fees/paiements - Créer un paiement
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    requireRole(user, [...FEE_COLLECT_ROLES])

    const body = await req.json()
    const data = createPaiementSchema.parse(body)

    const paiement = await createPaiement({
      ...data,
      schoolId: user.schoolId,
      createdBy: user.id,
    })

    const student = await prisma.student.findUnique({
      where: { id: paiement.studentId },
      select: { userId: true },
    })

    const typeFrais = paiement.tarification?.typeFrais?.nom || "frais scolaires"
    const devise = paiement.tarification?.devise || "USD"

    if (student?.userId) {
      await prisma.notification.create({
        data: {
          type: "SYSTEM_MESSAGE",
          message: `Paiement enregistré : ${paiement.montant} ${devise} pour ${typeFrais}. Reçu n° ${paiement.numeroRecu}.`,
          userId: student.userId,
          schoolId: user.schoolId,
          targetRole: "ALL",
        },
      })
    }

    await supabaseAdmin
      .channel(`fees:student:${paiement.studentId}`)
      .send({
        type: "broadcast",
        event: "payment_received",
        payload: {
          paiementId: paiement.id,
          montant: paiement.montant,
          devise,
          typeFrais,
        },
      })

    return NextResponse.json({ data: paiement }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
