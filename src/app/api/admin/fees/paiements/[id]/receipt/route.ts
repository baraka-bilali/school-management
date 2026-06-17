import { NextRequest, NextResponse } from "next/server"
import { getReceiptData } from "@/lib/fees"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { FEE_COLLECT_ROLES } from "@/lib/fees/roles"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/fees/paiements/[id]/receipt - Données du reçu
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getAuthUser(req)
    requireRole(user, [...FEE_COLLECT_ROLES])
    const { id } = await params

    const receiptData = await getReceiptData(parseInt(id))

    return NextResponse.json({ data: receiptData })
  } catch (error) {
    return handleApiError(error)
  }
}
