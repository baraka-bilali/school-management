import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTeacherFromRequest } from "@/lib/teacher-auth"
import { getAuthUser, requireRole, handleApiError } from "@/lib/fees/api-helpers"
import { findActiveGradeLock } from "@/lib/grading/grade-locks"

/**
 * POST body:
 * {
 *   action: "validate" | "unlock",
 *   assignmentId,
 *   kind: "PERIOD" | "EXAM",
 *   periodId?, periodGroupId?,
 *   unlockReason?
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = String(body.action || "")
    const assignmentId = parseInt(body.assignmentId, 10)
    const kind = body.kind === "EXAM" ? "EXAM" : body.kind === "PERIOD" ? "PERIOD" : null
    const periodId = body.periodId != null ? parseInt(body.periodId, 10) : null
    const periodGroupId = body.periodGroupId != null ? parseInt(body.periodGroupId, 10) : null
    const unlockReason = body.unlockReason != null ? String(body.unlockReason).trim() : ""

    if (!assignmentId || !kind || (action !== "validate" && action !== "unlock")) {
      return NextResponse.json(
        { error: "action (validate|unlock), assignmentId et kind (PERIOD|EXAM) requis" },
        { status: 400 }
      )
    }
    if (kind === "PERIOD" && !periodId) {
      return NextResponse.json({ error: "periodId requis pour PERIOD" }, { status: 400 })
    }
    if (kind === "EXAM" && !periodGroupId) {
      return NextResponse.json({ error: "periodGroupId requis pour EXAM" }, { status: 400 })
    }

    const teacherCtx = await getTeacherFromRequest(req)
    let actorUserId: number | null = teacherCtx?.userId ?? null
    let schoolId: number | null = teacherCtx?.schoolId ?? null
    let asAdmin = false

    if (!teacherCtx) {
      try {
        const user = getAuthUser(req)
        requireRole(user, ["ADMIN", "DIRECTEUR_ETUDES", "SUPER_ADMIN"])
        actorUserId = user.id
        schoolId = user.schoolId
        asAdmin = true
      } catch {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
      }
    }

    if (!actorUserId || !schoolId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const assignment = await prisma.courseAssignment.findFirst({
      where: {
        id: assignmentId,
        schoolId,
        isActive: true,
        ...(teacherCtx && !asAdmin ? { teacherId: teacherCtx.teacherId } : {}),
      },
    })
    if (!assignment) {
      return NextResponse.json({ error: "Cours non assigné" }, { status: 404 })
    }

    if (kind === "PERIOD") {
      const period = await prisma.period.findFirst({
        where: { id: periodId!, periodGroup: { cycle: { schoolId } } },
      })
      if (!period) {
        return NextResponse.json({ error: "Période introuvable" }, { status: 404 })
      }
    } else {
      const group = await prisma.periodGroup.findFirst({
        where: { id: periodGroupId!, cycle: { schoolId } },
      })
      if (!group) {
        return NextResponse.json({ error: "Trimestre/groupe introuvable" }, { status: 404 })
      }
    }

    const existing = await findActiveGradeLock({
      schoolId,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      kind,
      periodId,
      periodGroupId,
    })

    if (action === "validate") {
      if (existing) {
        return NextResponse.json({ ok: true, alreadyLocked: true, lock: existing })
      }

      const lock = await prisma.gradeEntryLock.create({
        data: {
          schoolId,
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          kind,
          periodId: kind === "PERIOD" ? periodId : null,
          periodGroupId: kind === "EXAM" ? periodGroupId : null,
          courseAssignmentId: assignment.id,
          lockedByUserId: actorUserId,
        },
      })

      return NextResponse.json({
        ok: true,
        lock,
        message:
          kind === "PERIOD"
            ? "Période validée — notes verrouillées et prises en compte pour le bulletin."
            : "Examen validé — notes verrouillées et prises en compte pour le bulletin.",
      })
    }

    if (!existing) {
      return NextResponse.json({ error: "Aucun verrou actif à lever" }, { status: 400 })
    }
    if (!unlockReason) {
      return NextResponse.json({ error: "Un motif de déverrouillage est requis" }, { status: 400 })
    }

    const lock = await prisma.gradeEntryLock.update({
      where: { id: existing.id },
      data: {
        unlockedAt: new Date(),
        unlockedByUserId: actorUserId,
        unlockReason,
      },
    })

    return NextResponse.json({
      ok: true,
      lock,
      message: "Notes déverrouillées — modification à nouveau possible.",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
