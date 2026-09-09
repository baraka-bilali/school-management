import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getNextClassCode } from "@/lib/student-fields"
import { invalidateCachePattern } from "@/lib/cache"
import type { DecisionPassage, EnrollmentOrigine, EnrollmentStatus } from "@prisma/client"

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

const DECISIONS = ["PASSAGE", "REDOUBLEMENT", "ORIENTATION", "RENVOI"] as const
type Decision = (typeof DECISIONS)[number]

function parseDecision(value: string | null | undefined): Decision | null | undefined {
  if (value === null || value === "") return null
  if (value === undefined) return undefined
  return DECISIONS.includes(value as Decision) ? (value as Decision) : undefined
}

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
        // Inclure EXPELLED pour afficher les renvois déjà enregistrés
        status: { in: ["ACTIVE", "CONFIRMEE", "PROPOSEE", "EXPELLED"] },
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

type ConfirmedWarning = {
  enrollmentId: number
  studentId: number
  studentName: string
  confirmedEnrollmentId: number
  confirmedYearId: number
  confirmedYearName: string
  confirmedClassId: number
  confirmedClassName: string
  message: string
}

/**
 * PATCH /api/admin/enrollments/decisions
 * Body: { updates: [...], targetYearId?: number }
 *
 * - RENVOI → status EXPELLED à l'enregistrement
 * - Si proposition N+1 PROPOSEE existe → régénérée selon la nouvelle décision
 * - Si proposition N+1 CONFIRMEE/ACTIVE → warning, pas de modif auto
 * - Historique EnrollmentDecisionHistory
 */
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
    const targetYearId = body.targetYearId ? Number(body.targetYearId) : null

    if (!updates.length) {
      return NextResponse.json({ error: "Aucune mise à jour" }, { status: 400 })
    }

    const ids = updates.map((u) => u.enrollmentId).filter(Boolean)
    const owned = await prisma.enrollment.findMany({
      where: {
        id: { in: ids },
        student: { user: { schoolId: auth.schoolId } },
      },
      include: {
        student: {
          select: { id: true, lastName: true, firstName: true, middleName: true },
        },
        class: { select: { id: true, nextClassId: true } },
        year: { select: { id: true, name: true } },
      },
    })
    const ownedMap = new Map(owned.map((e) => [e.id, e]))

    let updated = 0
    const warnings: ConfirmedWarning[] = []
    const regenerated: number[] = []
    const deletedProposals: number[] = []

    for (const u of updates) {
      const current = ownedMap.get(u.enrollmentId)
      if (!current) continue

      const decision =
        u.decisionPassage !== undefined
          ? parseDecision(u.decisionPassage)
          : undefined
      if (decision === undefined && u.decisionPassage !== undefined) continue

      const newComment =
        u.commentaireConseil !== undefined ? u.commentaireConseil : undefined
      const oldDecision = current.decisionPassage
      const oldComment = current.commentaireConseil

      const decisionChanged =
        decision !== undefined && decision !== oldDecision
      const commentChanged =
        newComment !== undefined && newComment !== (oldComment || "")

      if (!decisionChanged && !commentChanged && u.dateDecision === undefined) {
        continue
      }

      const data: {
        decisionPassage?: DecisionPassage | null
        commentaireConseil?: string | null
        dateDecision?: Date | null
        status?: EnrollmentStatus
        exitReason?: string | null
      } = {}

      if (decision !== undefined) {
        data.decisionPassage = decision
        if (decision === "RENVOI") {
          data.status = "EXPELLED"
          if (newComment !== undefined) {
            data.exitReason = newComment || "Renvoi (conseil de classe)"
          } else if (oldComment) {
            data.exitReason = oldComment
          } else {
            data.exitReason = "Renvoi (conseil de classe)"
          }
        } else if (current.status === "EXPELLED" && oldDecision === "RENVOI") {
          // Réactivation si on annule un renvoi
          data.status = "ACTIVE"
          data.exitReason = null
        }
      }
      if (newComment !== undefined) {
        data.commentaireConseil = newComment
        if (decision === "RENVOI" || (decision === undefined && oldDecision === "RENVOI")) {
          data.exitReason = newComment || data.exitReason || current.exitReason
        }
      }
      if (u.dateDecision !== undefined) {
        data.dateDecision = u.dateDecision ? new Date(u.dateDecision) : null
      } else if (decision) {
        data.dateDecision = new Date()
      }

      await prisma.$transaction(async (tx) => {
        await tx.enrollment.update({
          where: { id: u.enrollmentId },
          data,
        })

        if (decisionChanged || commentChanged) {
          await tx.enrollmentDecisionHistory.create({
            data: {
              enrollmentId: u.enrollmentId,
              oldDecision: oldDecision,
              newDecision: decision !== undefined ? decision : oldDecision,
              oldComment: oldComment,
              newComment: newComment !== undefined ? newComment : oldComment,
              changedByUserId: auth.id,
            },
          })
        }
      })
      updated++

      // Sync proposition N+1 uniquement si la décision change
      if (!decisionChanged) continue

      const futureWhere = {
        studentId: current.studentId,
        yearId: targetYearId
          ? targetYearId
          : { not: current.yearId },
        status: { in: ["PROPOSEE", "CONFIRMEE", "ACTIVE"] as EnrollmentStatus[] },
      }

      const futures = await prisma.enrollment.findMany({
        where: futureWhere,
        include: {
          year: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
        orderBy: { year: { name: "asc" } },
      })

      // Prefer explicit target year; else first future enrollment
      const future =
        (targetYearId
          ? futures.find((f) => f.yearId === targetYearId)
          : null) ||
        futures.find((f) => f.yearId !== current.yearId) ||
        null

      if (!future) {
        // Pas encore de proposition : rien à sync (la génération N+1 s'en chargera)
        continue
      }

      if (future.status === "CONFIRMEE" || future.status === "ACTIVE") {
        const name = [current.student.lastName, current.student.middleName, current.student.firstName]
          .filter(Boolean)
          .join(" ")
        warnings.push({
          enrollmentId: current.id,
          studentId: current.studentId,
          studentName: name,
          confirmedEnrollmentId: future.id,
          confirmedYearId: future.yearId,
          confirmedYearName: future.year.name,
          confirmedClassId: future.classId,
          confirmedClassName: future.class.name,
          message: `Cet élève a déjà une inscription confirmée pour ${future.year.name} en ${future.class.name}. Ce changement ne modifiera pas automatiquement cette inscription confirmée.`,
        })
        continue
      }

      // future.status === PROPOSEE → régénérer
      if (decision === "PASSAGE" || decision === "REDOUBLEMENT") {
        let targetClassId: number | null =
          decision === "REDOUBLEMENT" ? current.classId : current.class.nextClassId
        if (!targetClassId) {
          // Garde la classe actuelle de la proposition si pas de nextClassId
          targetClassId = future.classId
        }
        const code =
          future.classId === targetClassId && future.code
            ? future.code
            : String(await getNextClassCode(targetClassId, future.yearId))
        const origine: EnrollmentOrigine =
          decision === "REDOUBLEMENT" ? "REDOUBLEMENT" : "PASSAGE"
        await prisma.enrollment.update({
          where: { id: future.id },
          data: {
            classId: targetClassId,
            code,
            origine,
            status: "PROPOSEE",
          },
        })
        regenerated.push(future.id)
      } else {
        // ORIENTATION / RENVOI / null → supprimer la proposition non confirmée
        await prisma.enrollment.delete({ where: { id: future.id } })
        deletedProposals.push(future.id)
      }
    }

    invalidateCachePattern("students-*")

    return NextResponse.json({
      updated,
      warnings,
      regenerated: regenerated.length,
      deletedProposals: deletedProposals.length,
    })
  } catch (error) {
    console.error("Erreur update décisions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
