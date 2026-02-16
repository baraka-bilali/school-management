import { NextRequest, NextResponse } from "next/server"
import { getReceiptData } from "@/lib/fees"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/fees/paiements/[id]/receipt - Données du reçu
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, ["ADMIN", "COMPTABLE", "SUPER_ADMIN"])
    const { id } = await params

    const receiptData = await getReceiptData(parseInt(id))

    return NextResponse.json({ data: receiptData })
  } catch (error) {
    return handleApiError(error)
  }
}
