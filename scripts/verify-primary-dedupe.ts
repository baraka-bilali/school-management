import { PrismaClient } from "@prisma/client"
import {
  ensurePrimaryCurriculum,
  listPrimaryCurriculum,
} from "../src/lib/grading/ensure-primary-curriculum"

const prisma = new PrismaClient()

async function main() {
  const school = await prisma.school.findFirst()
  if (!school) throw new Error("no school")

  const before = await prisma.subject.count({ where: { isActive: true } })
  const results = await ensurePrimaryCurriculum(school.id)
  const after = await prisma.subject.count({ where: { isActive: true } })
  const primary = await prisma.subject.count({
    where: { isActive: true, primaryBranches: { some: {} } },
  })
  const generic = await prisma.subject.count({
    where: { isActive: true, primaryBranches: { none: {} } },
  })
  const multi = await prisma.$queryRawUnsafe<Array<{ key: string; n: number }>>(`
    SELECT lower(b.name) AS key, count(DISTINCT b."subjectId")::int AS n
    FROM "PrimaryBranch" b
    WHERE b."isActive" AND b."subjectId" IS NOT NULL
    GROUP BY lower(b.name)
    HAVING count(DISTINCT b."subjectId") > 1
  `)
  const listed = await listPrimaryCurriculum(school.id)
  const suffixNames = await prisma.subject.count({
    where: { isActive: true, name: { contains: "· Degré" } },
  })

  console.log(
    JSON.stringify(
      {
        before,
        after,
        primary,
        generic,
        keysWithMultipleSubjects: multi.length,
        suffixNames,
        results: results.map((r) => ({
          code: r.code,
          catalog: r.catalogMaxPeriodeTotal,
          db: r.dbMaxPeriodeTotal,
          needsReview: r.needsReview,
        })),
        degrees: listed.map((d) => ({
          code: d.code,
          levels: d.levels,
          maxP: d.maxPeriodeTotal,
          domains: d.domains.length,
          branches: d.domains.reduce(
            (n, dom) =>
              n +
              dom.branches.length +
              dom.groups.reduce((m, g) => m + g.branches.length, 0),
            0
          ),
        })),
      },
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
