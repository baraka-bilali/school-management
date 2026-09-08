import { NextRequest, NextResponse } from "next/server"
import { getParentFromRequest } from "@/lib/parent-auth"
import { prisma } from "@/lib/prisma"
import { calculateStudentFeesBreakdown } from "@/lib/fees/balance.service"
import { listPaiements } from "@/lib/fees/paiement.service"

async function assertChildAccess(parentId: number, studentId: number) {
  return prisma.parentStudent.findFirst({
    where: { parentId, studentId },
    include: {
      student: {
        select: {
          id: true,
          code: true,
          lastName: true,
          middleName: true,
          firstName: true,
          gender: true,
          photoUrl: true,
          enrollments: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              class: { select: { id: true, name: true, level: true, section: true, letter: true } },
              year: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const ctx = await getParentFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const studentId = parseInt((await params).studentId, 10)
  if (isNaN(studentId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const link = await assertChildAccess(ctx.parentId, studentId)
  if (!link) {
    return NextResponse.json({ error: "Élève non lié à ce compte" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const summaryOnly = searchParams.get("summary") === "1"
  const yearId = ctx.yearId
  const schoolId = ctx.schoolId
  const student = link.student
  const enrollment = student.enrollments[0] || null

  if (!yearId) {
    return NextResponse.json({
      student: {
        id: student.id,
        code: student.code,
        lastName: student.lastName,
        middleName: student.middleName,
        firstName: student.firstName,
        gender: student.gender,
        photoUrl: student.photoUrl,
        className: enrollment?.class?.name || null,
        yearName: enrollment?.year?.name || null,
        relationship: link.relationship,
      },
      scolaire: null,
      autres: [],
      balance: null,
      paiements: [],
      tasks: [],
      message: "Aucune année scolaire active",
    })
  }

  try {
    const [breakdown, paiementsResult, tasks] = await Promise.all([
      calculateStudentFeesBreakdown(studentId, yearId, schoolId).catch(() => null),
      summaryOnly
        ? Promise.resolve({ data: [] as Awaited<ReturnType<typeof listPaiements>>["data"] })
        : listPaiements({
            schoolId,
            studentId,
            yearId,
            isAnnule: false,
            page: 1,
            pageSize: 30,
          }).catch(() => ({ data: [] as Awaited<ReturnType<typeof listPaiements>>["data"] })),
      enrollment?.class?.id
        ? prisma.studentTask
            .findMany({
              where: {
                classId: enrollment.class.id,
                schoolId,
                isActive: true,
              },
              orderBy: { dueAt: "asc" },
              take: 20,
              include: {
                subject: { select: { name: true, color: true } },
                teacher: { select: { firstName: true, lastName: true } },
              },
            })
            .catch(() => [])
        : Promise.resolve([]),
    ])

    const paiements = (paiementsResult.data || []).map((p) => ({
      id: p.id,
      numeroRecu: p.numeroRecu,
      montant: p.montant,
      devise: p.tarification.devise,
      typeFrais: p.tarification.typeFrais.nom,
      datePaiement: p.datePaiement,
      modePaiement: p.modePaiement,
    }))

    return NextResponse.json({
      student: {
        id: student.id,
        code: student.code,
        lastName: student.lastName,
        middleName: student.middleName,
        firstName: student.firstName,
        gender: student.gender,
        photoUrl: student.photoUrl,
        className: enrollment?.class?.name || null,
        yearName: enrollment?.year?.name || null,
        relationship: link.relationship,
      },
      scolaire: breakdown?.scolaire ?? {
        usd: { totalDu: 0, totalPaye: 0, solde: 0 },
        cdf: { totalDu: 0, totalPaye: 0, solde: 0 },
      },
      autres: breakdown?.autres ?? [],
      balance: breakdown?.scolaire ?? null,
      paiements: summaryOnly ? [] : paiements,
      tasks,
      yearId,
    })
  } catch (error) {
    console.error("Erreur suivi enfant parent:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
