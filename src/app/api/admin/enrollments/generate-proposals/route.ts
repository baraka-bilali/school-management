import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { getNextClassCode } from "@/lib/student-fields"
import { invalidateCachePattern } from "@/lib/cache"
import { isStrictlyHigherClass } from "@/lib/class-sort"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

interface JwtPayload {
  id: number
  role: string
  schoolId?: number
}

const ALLOWED = ["ADMIN", "DIRECTEUR_ETUDES"]

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

/**
 * POST /api/admin/enrollments/generate-proposals
 * Body: { sourceYearId, targetYearId, overrides?: { [enrollmentId]: classId } }
 *
 * Pour chaque Enrollment source avec decisionPassage:
 * - PASSAGE → Enrollment PROPOSEE année N+1, classe = override || class.nextClassId
 * - REDOUBLEMENT → même classe, PROPOSEE
 * - ORIENTATION / RENVOI / null → ignoré (aucune proposition)
 *   Note: RENVOI passe l'Enrollment source à EXPELLED dès l'enregistrement
 *   de la décision (PATCH /decisions), pas à la génération.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getAuth(req)
    if (!auth?.schoolId || !ALLOWED.includes(auth.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const sourceYearId = Number(body.sourceYearId)
    const targetYearId = Number(body.targetYearId)
    const overrides: Record<string, number> = body.overrides || {}

    if (!sourceYearId || !targetYearId) {
      return NextResponse.json(
        { error: "sourceYearId et targetYearId sont requis" },
        { status: 400 }
      )
    }
    if (sourceYearId === targetYearId) {
      return NextResponse.json(
        { error: "L'année cible doit être différente de l'année source" },
        { status: 400 }
      )
    }

    const [sourceYear, targetYear] = await Promise.all([
      prisma.academicYear.findUnique({ where: { id: sourceYearId } }),
      prisma.academicYear.findUnique({ where: { id: targetYearId } }),
    ])
    if (!sourceYear || !targetYear) {
      return NextResponse.json({ error: "Année introuvable" }, { status: 400 })
    }

    const sources = await prisma.enrollment.findMany({
      where: {
        yearId: sourceYearId,
        student: { user: { schoolId: auth.schoolId } },
        decisionPassage: { in: ["PASSAGE", "REDOUBLEMENT"] },
        status: { in: ["ACTIVE", "CONFIRMEE"] },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true,
            section: true,
            nextClassId: true,
          },
        },
        student: { select: { id: true, permanentCode: true, lastName: true, firstName: true } },
      },
    })

    const created: Array<{ studentId: number; enrollmentId: number; classId: number }> = []
    const skipped: Array<{ studentId: number; reason: string }> = []

    for (const src of sources) {
      const existing = await prisma.enrollment.findUnique({
        where: {
          studentId_yearId: { studentId: src.studentId, yearId: targetYearId },
        },
      })
      if (existing) {
        skipped.push({
          studentId: src.studentId,
          reason: `Déjà inscrit pour l'année cible (${existing.status})`,
        })
        continue
      }

      let targetClassId: number | null = null
      const override = overrides[String(src.id)]
      if (override) {
        targetClassId = Number(override)
      } else if (src.decisionPassage === "REDOUBLEMENT") {
        targetClassId = src.classId
      } else if (src.decisionPassage === "PASSAGE") {
        targetClassId = src.class.nextClassId
      }

      if (!targetClassId) {
        skipped.push({
          studentId: src.studentId,
          reason:
            src.decisionPassage === "PASSAGE"
              ? "Classe supérieure non définie (configurez nextClassId ou choisissez manuellement)"
              : "Classe cible introuvable",
        })
        continue
      }

      const schoolClass = await prisma.class.findFirst({
        where: { id: targetClassId, schoolId: auth.schoolId },
        select: { id: true, level: true, section: true, name: true },
      })
      if (!schoolClass) {
        skipped.push({ studentId: src.studentId, reason: "Classe cible invalide pour cette école" })
        continue
      }

      // Passage: refuse toute régression de niveau (saut autorisé)
      if (
        src.decisionPassage === "PASSAGE" &&
        src.class.section &&
        src.class.level &&
        schoolClass.section &&
        schoolClass.level &&
        !isStrictlyHigherClass(
          { section: src.class.section, level: src.class.level },
          { section: schoolClass.section, level: schoolClass.level }
        )
      ) {
        skipped.push({
          studentId: src.studentId,
          reason: `Classe cible « ${schoolClass.name} » n'est pas supérieure à « ${src.class.name} »`,
        })
        continue
      }

      // Mémoriser le choix comme nextClassId si encore vide (évite de redemander)
      if (
        src.decisionPassage === "PASSAGE" &&
        !src.class.nextClassId &&
        override
      ) {
        await prisma.class.update({
          where: { id: src.classId },
          data: { nextClassId: targetClassId },
        })
      }

      const code = String(await getNextClassCode(targetClassId, targetYearId))
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: src.studentId,
          classId: targetClassId,
          yearId: targetYearId,
          code,
          status: "PROPOSEE",
          origine: src.decisionPassage === "REDOUBLEMENT" ? "REDOUBLEMENT" : "PASSAGE",
        },
      })
      created.push({
        studentId: src.studentId,
        enrollmentId: enrollment.id,
        classId: targetClassId,
      })
    }

    invalidateCachePattern("students-*")

    return NextResponse.json({
      created: created.length,
      skipped: skipped.length,
      details: { created, skipped },
    })
  } catch (error) {
    console.error("Erreur génération propositions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
