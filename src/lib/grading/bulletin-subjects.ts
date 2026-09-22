/**
 * Matières issues des bulletins officiels (catalogues) vs créations libres.
 * Primaire = PrimaryBranch / codes PRI-*
 * EB = codes CTEB-*
 * Humanités = pas encore de catalogue officiel → aucune matière libre.
 */

import { prisma } from "@/lib/prisma"
import {
  CTEB_DEGREE_CATALOG,
  flattenCtebBranches,
} from "@/lib/grading/cteb-curriculum-catalog"

export function ctebCatalogCodes(): string[] {
  const codes = new Set<string>()
  for (const degree of CTEB_DEGREE_CATALOG) {
    for (const b of flattenCtebBranches(degree)) codes.add(b.code)
  }
  return [...codes]
}

export function isCtebCatalogCode(code: string): boolean {
  return code.startsWith("CTEB-")
}

/**
 * Désactive les matières créées manuellement (hors catalogue bulletin)
 * et leurs affectations. Conserve primaire (PrimaryBranch) et CTEB-*.
 */
export async function purgeNonCatalogSubjects(schoolId: number) {
  const catalogCodes = ctebCatalogCodes()

  const manual = await prisma.subject.findMany({
    where: {
      schoolId,
      isActive: true,
      primaryBranches: { none: {} },
      NOT: {
        OR: [
          { code: { in: catalogCodes } },
          { code: { startsWith: "CTEB-" } },
          { code: { startsWith: "PRI-" } },
        ],
      },
    },
    select: { id: true, name: true, code: true },
  })

  if (manual.length === 0) {
    return { purged: 0, subjects: [] as typeof manual }
  }

  const ids = manual.map((s) => s.id)

  await prisma.$transaction([
    prisma.courseAssignment.updateMany({
      where: { schoolId, subjectId: { in: ids }, isActive: true },
      data: { isActive: false },
    }),
    prisma.subject.updateMany({
      where: { id: { in: ids }, schoolId },
      data: { isActive: false },
    }),
  ])

  return { purged: manual.length, subjects: manual }
}
