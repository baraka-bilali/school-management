import { NextRequest, NextResponse } from "next/server"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { prisma } from "@/lib/prisma"
import { COMMUNIQUE_NOTIF_PREFIX } from "@/lib/communique-user-read"

export async function GET(req: NextRequest) {
  const ctx = await getTeacherFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // On ne compte que les notifications "autres" (hors communiqués),
  // les communiqués ayant leur propre compteur dédié.
  const unread = await prisma.notification.count({
    where: {
      userId: ctx.userId,
      isRead: false,
      NOT: { message: { startsWith: COMMUNIQUE_NOTIF_PREFIX } },
    },
  })

  return NextResponse.json({ unread })
}
