import { prisma } from "@/lib/prisma"

/** Année scolaire de l'inscription active de l'élève. */
export async function getStudentActiveYearId(studentId: number): Promise<number | null> {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { yearId: true },
  })
  return enrollment?.yearId ?? null
}
