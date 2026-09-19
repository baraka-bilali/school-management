import { prisma } from "@/lib/prisma"

export type ParentStudentConflict = {
  studentId: number
  studentName: string
  parentId: number
  parentName: string
}

/** Élèves déjà liés à un autre parent (hors excludeParentId). */
export async function findParentStudentConflicts(
  schoolId: number,
  studentIds: number[],
  excludeParentId?: number | null
): Promise<ParentStudentConflict[]> {
  const uniqueIds = [...new Set(studentIds.filter((id) => Number.isFinite(id)))]
  if (uniqueIds.length === 0) return []

  const links = await prisma.parentStudent.findMany({
    where: {
      studentId: { in: uniqueIds },
      ...(excludeParentId != null ? { parentId: { not: excludeParentId } } : {}),
      parent: { user: { schoolId } },
    },
    select: {
      studentId: true,
      parentId: true,
      student: {
        select: {
          permanentCode: true,
          lastName: true,
          middleName: true,
          firstName: true,
        },
      },
      parent: {
        select: {
          lastName: true,
          middleName: true,
          firstName: true,
        },
      },
    },
  })

  return links.map((link) => {
    const studentName = [link.student.lastName, link.student.middleName, link.student.firstName]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
    const parentName = [link.parent.lastName, link.parent.middleName, link.parent.firstName]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
    return {
      studentId: link.studentId,
      studentName: studentName || link.student.permanentCode || `Élève #${link.studentId}`,
      parentId: link.parentId,
      parentName: parentName || `Parent #${link.parentId}`,
    }
  })
}

export function formatParentStudentConflictError(conflicts: ParentStudentConflict[]): string {
  if (conflicts.length === 0) return "Un ou plusieurs élèves sont déjà liés à un autre parent"
  if (conflicts.length === 1) {
    const c = conflicts[0]
    return `${c.studentName} est déjà lié(e) au parent ${c.parentName}. Un élève ne peut avoir qu'un seul parent.`
  }
  const preview = conflicts
    .slice(0, 3)
    .map((c) => `${c.studentName} → ${c.parentName}`)
    .join(" ; ")
  const more = conflicts.length > 3 ? ` (+${conflicts.length - 3})` : ""
  return `Ces élèves ont déjà un parent : ${preview}${more}. Un élève ne peut avoir qu'un seul parent.`
}
