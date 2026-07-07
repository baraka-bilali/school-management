import { prisma } from "@/lib/prisma"

export async function getTeacherAssignedClassIds(
  teacherId: number,
  schoolId: number,
  yearId: number | null
): Promise<Set<number>> {
  if (!yearId) return new Set()
  const rows = await prisma.courseAssignment.findMany({
    where: { teacherId, schoolId, yearId, isActive: true },
    select: { classId: true },
  })
  return new Set(rows.map((r) => r.classId))
}

export async function teacherHasClassAccess(
  teacherId: number,
  schoolId: number,
  yearId: number | null,
  classId: number
): Promise<boolean> {
  if (!yearId) return false
  const assignment = await prisma.courseAssignment.findFirst({
    where: { teacherId, schoolId, yearId, classId, isActive: true },
    select: { id: true },
  })
  return Boolean(assignment)
}
