/**
 * Deduplicate primary-curriculum Subject rows that were created once per degree.
 *
 * Usage:
 *   npx tsx scripts/dedupe-primary-subjects.ts           # dry-run (default)
 *   npx tsx scripts/dedupe-primary-subjects.ts --apply    # apply merges
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function slugCode(input: string, maxLen = 20): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, maxLen)
  return base || "BR"
}

function shortHash(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
  return Math.abs(h).toString(36).toUpperCase().padStart(4, "0").slice(0, 4)
}

function canonicalCode(branchName: string): string {
  return `PRI-${slugCode(branchName, 16)}-${shortHash(norm(branchName))}`.slice(0, 32)
}

type GroupMember = {
  subjectId: number
  code: string
  name: string
  schoolId: number
  branchId: number
  branchName: string
  maxPeriode: number
  degreeCode: string
  assignments: number
  periodMaxima: number
  examMaxima: number
  examGrades: number
  gradeLocks: number
}

async function main() {
  const branches = await prisma.primaryBranch.findMany({
    where: { subjectId: { not: null }, isActive: true },
    include: {
      subject: true,
      domain: { include: { degree: true } },
    },
    orderBy: { id: "asc" },
  })

  const groups = new Map<string, GroupMember[]>()
  for (const b of branches) {
    if (!b.subject || !b.subjectId) continue
    const key = `${b.subject.schoolId}::${norm(b.name)}`
    const member: GroupMember = {
      subjectId: b.subject.id,
      code: b.subject.code,
      name: b.subject.name,
      schoolId: b.subject.schoolId,
      branchId: b.id,
      branchName: b.name,
      maxPeriode: b.maxPeriode,
      degreeCode: b.domain.degree.code,
      assignments: 0,
      periodMaxima: 0,
      examMaxima: 0,
      examGrades: 0,
      gradeLocks: 0,
    }
    if (!groups.has(key)) groups.set(key, [])
    // Avoid listing same subject twice if somehow linked twice
    const list = groups.get(key)!
    if (!list.some((m) => m.subjectId === member.subjectId && m.branchId === member.branchId)) {
      list.push(member)
    }
  }

  // Enrich counts
  for (const members of groups.values()) {
    for (const m of members) {
      const [assignments, periodMaxima, examMaxima, examGrades, gradeLocks] = await Promise.all([
        prisma.courseAssignment.count({ where: { subjectId: m.subjectId } }),
        prisma.subjectPeriodMax.count({ where: { subjectId: m.subjectId } }),
        prisma.subjectExamMax.count({ where: { subjectId: m.subjectId } }),
        prisma.examGrade.count({ where: { subjectId: m.subjectId } }),
        prisma.gradeEntryLock.count({ where: { subjectId: m.subjectId } }),
      ])
      m.assignments = assignments
      m.periodMaxima = periodMaxima
      m.examMaxima = examMaxima
      m.examGrades = examGrades
      m.gradeLocks = gradeLocks
    }
  }

  const multi = [...groups.entries()]
    .map(([key, members]) => {
      const uniqueSubjects = [...new Map(members.map((m) => [m.subjectId, m])).values()]
      return { key, members, uniqueSubjects }
    })
    .filter((g) => g.uniqueSubjects.length > 1)
    .sort((a, b) => b.uniqueSubjects.length - a.uniqueSubjects.length)

  console.log("=== DRY-RUN REPORT: primary Subject deduplication ===")
  console.log(`mode=${APPLY ? "APPLY" : "DRY-RUN"}`)
  console.log(`primaryBranchesLinked=${branches.length}`)
  console.log(`canonicalKeys=${groups.size}`)
  console.log(`keysWithMultipleSubjects=${multi.length}`)
  console.log(
    `subjectRowsRemovable=${multi.reduce((n, g) => n + g.uniqueSubjects.length - 1, 0)}`
  )
  console.log("")

  const plan: Array<{
    key: string
    keepId: number
    keepCode: string
    keepName: string
    mergeIds: number[]
    branches: Array<{ branchId: number; degree: string; maxPeriode: number }>
  }> = []

  for (const g of multi) {
    // Prefer subject with most usage, then lowest id
    const ranked = [...g.uniqueSubjects].sort((a, b) => {
      const score = (m: GroupMember) =>
        m.assignments * 1000 + m.examGrades * 100 + m.periodMaxima + m.examMaxima
      const d = score(b) - score(a)
      if (d !== 0) return d
      return a.subjectId - b.subjectId
    })
    const keep = ranked[0]
    const mergeIds = ranked.slice(1).map((m) => m.subjectId)
    const branchName = g.members[0].branchName
    plan.push({
      key: g.key,
      keepId: keep.subjectId,
      keepCode: canonicalCode(branchName),
      keepName: branchName,
      mergeIds,
      branches: g.members.map((m) => ({
        branchId: m.branchId,
        degree: m.degreeCode,
        maxPeriode: m.maxPeriode,
      })),
    })

    console.log(`KEY="${norm(branchName)}" → keep #${keep.subjectId}, merge [${mergeIds.join(", ")}]`)
    for (const m of ranked) {
      console.log(
        `  subject#${m.subjectId} ${m.code} "${m.name}" deg=${m.degreeCode} maxP=${m.maxPeriode} a=${m.assignments} pm=${m.periodMaxima} em=${m.examMaxima} eg=${m.examGrades}`
      )
    }
  }

  // Singles that still have degree suffix / wrong code — rename only
  const renameOnly: Array<{ subjectId: number; name: string; code: string }> = []
  for (const [, members] of groups) {
    const uniqueSubjects = [...new Map(members.map((m) => [m.subjectId, m])).values()]
    if (uniqueSubjects.length !== 1) continue
    const m = uniqueSubjects[0]
    const wantName = m.branchName
    const wantCode = canonicalCode(m.branchName)
    if (m.name === wantName && m.code === wantCode) continue
    const codeTaken = await prisma.subject.findFirst({
      where: { schoolId: m.schoolId, code: wantCode, NOT: { id: m.subjectId } },
      select: { id: true },
    })
    renameOnly.push({
      subjectId: m.subjectId,
      name: wantName,
      // Keep distinct codes when slug truncates collide (e.g. Lecture-Écriture…)
      code: codeTaken ? m.code : wantCode,
    })
  }
  const renameNeeded = renameOnly.filter((r) => {
    const cur = [...groups.values()].flat().find((m) => m.subjectId === r.subjectId)
    return cur && (cur.name !== r.name || cur.code !== r.code)
  })
  console.log(`\nrenameOnlySingles=${renameNeeded.length}`)

  if (!APPLY) {
    console.log("\nDry-run only. Re-run with --apply to execute.")
    return
  }

  console.log("\n=== APPLYING ===")

  for (const item of plan) {
    await prisma.$transaction(
      async (tx) => {
        let code = item.keepCode
        const keep = await tx.subject.findUnique({ where: { id: item.keepId } })
        if (!keep) throw new Error(`keep subject #${item.keepId} missing`)
        const clash = await tx.subject.findFirst({
          where: { schoolId: keep.schoolId, code, NOT: { id: item.keepId } },
        })
        if (clash) code = `${item.keepCode}`.slice(0, 28) + `-${item.keepId}`.slice(-3)

        await tx.subject.update({
          where: { id: item.keepId },
          data: { name: item.keepName, code, color: "#0f766e", isActive: true },
        })

        for (const fromId of item.mergeIds) {
          await tx.primaryBranch.updateMany({
            where: { subjectId: fromId },
            data: { subjectId: item.keepId },
          })

          // Bulk move maxima: drop conflicts then reassign
          await tx.$executeRaw`
            DELETE FROM "SubjectPeriodMax" AS a
            USING "SubjectPeriodMax" AS b
            WHERE a."subjectId" = ${fromId}
              AND b."subjectId" = ${item.keepId}
              AND a.section = b.section
              AND a.level = b.level
              AND a.stream = b.stream
              AND a."periodId" = b."periodId"`
          await tx.$executeRaw`
            UPDATE "SubjectPeriodMax" SET "subjectId" = ${item.keepId}
            WHERE "subjectId" = ${fromId}`

          await tx.$executeRaw`
            DELETE FROM "SubjectExamMax" AS a
            USING "SubjectExamMax" AS b
            WHERE a."subjectId" = ${fromId}
              AND b."subjectId" = ${item.keepId}
              AND a.section = b.section
              AND a.level = b.level
              AND a.stream = b.stream
              AND a."periodGroupId" = b."periodGroupId"`
          await tx.$executeRaw`
            UPDATE "SubjectExamMax" SET "subjectId" = ${item.keepId}
            WHERE "subjectId" = ${fromId}`

          // Assignments: remount related rows onto the survivor before delete
          // (ExamGrade / ScheduleSlot cascade on CourseAssignment delete).
          const assignments = await tx.courseAssignment.findMany({ where: { subjectId: fromId } })
          for (const a of assignments) {
            const existing = await tx.courseAssignment.findUnique({
              where: {
                subjectId_classId_yearId_schoolId: {
                  subjectId: item.keepId,
                  classId: a.classId,
                  yearId: a.yearId,
                  schoolId: a.schoolId,
                },
              },
            })
            if (existing) {
              await tx.evaluationColumn.updateMany({
                where: { courseAssignmentId: a.id },
                data: { courseAssignmentId: existing.id },
              })
              await tx.scheduleSlot.updateMany({
                where: { assignmentId: a.id },
                data: { assignmentId: existing.id },
              })
              // Exam grades: drop conflicts on keep subject (unique is enrollment+subject+periodGroup)
              await tx.$executeRaw`
                DELETE FROM "ExamGrade" AS a
                USING "ExamGrade" AS b
                WHERE a."courseAssignmentId" = ${a.id}
                  AND b."subjectId" = ${item.keepId}
                  AND a."enrollmentId" = b."enrollmentId"
                  AND a."periodGroupId" = b."periodGroupId"`
              await tx.examGrade.updateMany({
                where: { courseAssignmentId: a.id },
                data: { courseAssignmentId: existing.id, subjectId: item.keepId },
              })
              await tx.courseAssignment.delete({ where: { id: a.id } })
            } else {
              await tx.courseAssignment.update({
                where: { id: a.id },
                data: { subjectId: item.keepId },
              })
              await tx.examGrade.updateMany({
                where: { courseAssignmentId: a.id },
                data: { subjectId: item.keepId },
              })
            }
          }

          // Any remaining exam grades still on fromId (orphaned / no assignment path)
          await tx.$executeRaw`
            DELETE FROM "ExamGrade" AS a
            USING "ExamGrade" AS b
            WHERE a."subjectId" = ${fromId}
              AND b."subjectId" = ${item.keepId}
              AND a."enrollmentId" = b."enrollmentId"
              AND a."periodGroupId" = b."periodGroupId"`
          await tx.$executeRaw`
            UPDATE "ExamGrade" SET "subjectId" = ${item.keepId}
            WHERE "subjectId" = ${fromId}`

          await tx.gradeEntryLock.updateMany({
            where: { subjectId: fromId },
            data: { subjectId: item.keepId },
          })
          await tx.studentTask.updateMany({
            where: { subjectId: fromId },
            data: { subjectId: item.keepId },
          })

          await tx.subject.delete({ where: { id: fromId } })
        }
      },
      { timeout: 120_000, maxWait: 20_000 }
    )
    console.log(`merged → #${item.keepId} (${item.keepName})`)
  }

  for (const r of renameNeeded) {
    try {
      await prisma.subject.update({
        where: { id: r.subjectId },
        data: { name: r.name, code: r.code },
      })
      console.log(`renamed #${r.subjectId} → ${r.code} "${r.name}"`)
    } catch (e) {
      // Code collision: keep name, leave code
      await prisma.subject.update({
        where: { id: r.subjectId },
        data: { name: r.name },
      })
      console.log(`renamed name only #${r.subjectId} → "${r.name}" (code clash)`)
    }
  }

  const remaining = await prisma.subject.count({
    where: { isActive: true, primaryBranches: { some: {} } },
  })
  const generic = await prisma.subject.count({
    where: { isActive: true, primaryBranches: { none: {} } },
  })
  console.log(`\nDone. primaryLinkedSubjects=${remaining} genericSubjects=${generic}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
