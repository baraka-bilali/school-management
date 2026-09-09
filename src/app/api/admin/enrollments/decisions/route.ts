import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

const ALLOWED = ["ADMIN", "DIRECTEUR_ETUDES", "DIRECTEUR_DISCIPLINE"]

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

const DECISIONS = ["PASSAGE", "REDOUBLEMENT", "ORIENTATION"] as const

/** GET /api/admin/enrollments/decisions?yearId= */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId || !ALLOWED.includes(auth.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const yearId = parseInt(req.nextUrl.searchParams.get("yearId") || "", 10)
    if (!yearId) {
      return NextResponse.json({ error: "yearId requis" }, { status: 400 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        yearId,
        student: { user: { schoolId: auth.schoolId } },
        status: { in: ["ACTIVE", "CONFIRMEE", "PROPOSEE"] },
      },
      include: {
        student: {
          select: {
            id: true,
            permanentCode: true,
            lastName: true,
            middleName: true,
            firstName: true,
            gender: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true,
            section: true,
            letter: true,
            stream: true,
            nextClassId: true,
            nextClass: { select: { id: true, name: true } },
          },
        },
        year: { select: { id: true, name: true } },
      },
      orderBy: [
        { class: { section: "asc" } },
        { class: { level: "asc" } },
        { student: { lastName: "asc" } },
      ],
    })

    return NextResponse.json({
      items: enrollments.map((e) => ({
        id: e.id,
        studentId: e.studentId,
        classId: e.classId,
        yearId: e.yearId,
        code: e.code,
        status: e.status,
        origine: e.origine,
        decisionPassage: e.decisionPassage,
        dateDecision: e.dateDecision,
        commentaireConseil: e.commentaireConseil,
        student: {
          ...e.student,
          code: e.student.permanentCode,
        },
        class: e.class,
        year: e.year,
      })),
    })
  } catch (error) {
    console.error("Erreur liste décisions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

/** PATCH /api/admin/enrollments/decisions — bulk update decisions */
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId || !ALLOWED.includes(auth.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const updates: Array<{
      enrollmentId: number
      decisionPassage?: string | null
      commentaireConseil?: string | null
      dateDecision?: string | null
    }> = Array.isArray(body.updates) ? body.updates : []

    if (!updates.length) {
      return NextResponse.json({ error: "Aucune mise à jour" }, { status: 400 })
    }

    const ids = updates.map((u) => u.enrollmentId).filter(Boolean)
    const owned = await prisma.enrollment.findMany({
      where: {
        id: { in: ids },
        student: { user: { schoolId: auth.schoolId } },
      },
      select: { id: true },
    })
    const ownedIds = new Set(owned.map((e) => e.id))

    let updated = 0
    for (const u of updates) {
      if (!ownedIds.has(u.enrollmentId)) continue
      const decision =
        u.decisionPassage === null || u.decisionPassage === ""
          ? null
          : DECISIONS.includes(u.decisionPassage as (typeof DECISIONS)[number])
            ? (u.decisionPassage as (typeof DECISIONS)[number])
            : undefined
      if (decision === undefined && u.decisionPassage !== undefined) continue

      await prisma.enrollment.update({
        where: { id: u.enrollmentId },
        data: {
          ...(u.decisionPassage !== undefined ? { decisionPassage: decision } : {}),
          ...(u.commentaireConseil !== undefined
            ? { commentaireConseil: u.commentaireConseil }
            : {}),
          ...(u.dateDecision !== undefined
            ? {
                dateDecision: u.dateDecision ? new Date(u.dateDecision) : null,
              }
            : decision
              ? { dateDecision: new Date() }
              : {}),
        },
      })
      updated++
    }

    return NextResponse.json({ updated })
  } catch (error) {
    console.error("Erreur update décisions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
