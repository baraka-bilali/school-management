import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { findParentStudentConflicts } from "@/lib/parent-student-links"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

type JwtPayload = { id: number; role: string; schoolId?: number }

/**
 * GET /api/admin/parents/student-links?ids=1,2,3&excludeParentId=
 * Indique quels élèves sont déjà liés à un parent.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    let auth: JwtPayload
    try {
      auth = jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!auth.schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const idsRaw = searchParams.get("ids") || ""
    const excludeParentIdRaw = searchParams.get("excludeParentId")
    const studentIds = idsRaw
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => Number.isFinite(n))
    const excludeParentId = excludeParentIdRaw
      ? parseInt(excludeParentIdRaw, 10)
      : null

    if (studentIds.length === 0) {
      return NextResponse.json({ links: {} })
    }

    const conflicts = await findParentStudentConflicts(
      auth.schoolId,
      studentIds,
      Number.isFinite(excludeParentId as number) ? excludeParentId : null
    )

    const links: Record<number, { parentId: number; parentName: string }> = {}
    for (const c of conflicts) {
      links[c.studentId] = { parentId: c.parentId, parentName: c.parentName }
    }

    return NextResponse.json({ links })
  } catch (error) {
    console.error("[parents/student-links]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
