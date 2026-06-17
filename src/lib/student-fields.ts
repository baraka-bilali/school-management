import { prisma } from "@/lib/prisma"

/** Met en majuscules les champs texte identité (saisie libre, stockage uniforme). */
export function toUpperText(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase()
}

export function normalizeStudentIdentity(input: {
  lastName?: string
  middleName?: string
  firstName?: string
}) {
  return {
    lastName: toUpperText(input.lastName),
    middleName: toUpperText(input.middleName),
    firstName: toUpperText(input.firstName),
  }
}

export function normalizeStudentProfile(input: {
  birthPlace?: string | null
  nationality?: string | null
  address?: string | null
  parentName1?: string | null
  parentName2?: string | null
  parentJob1?: string | null
  parentJob2?: string | null
  emergencyContact?: string | null
  allergies?: string | null
  medicalNotes?: string | null
}) {
  const upper = (v?: string | null) => (v?.trim() ? toUpperText(v) : v?.trim() || null)
  const out: Record<string, string | null> = {}

  if (input.birthPlace !== undefined) out.birthPlace = upper(input.birthPlace)
  if (input.nationality !== undefined) out.nationality = upper(input.nationality)
  if (input.address !== undefined) out.address = upper(input.address)
  if (input.parentName1 !== undefined) out.parentName1 = upper(input.parentName1)
  if (input.parentName2 !== undefined) out.parentName2 = upper(input.parentName2)
  if (input.parentJob1 !== undefined) out.parentJob1 = upper(input.parentJob1)
  if (input.parentJob2 !== undefined) out.parentJob2 = upper(input.parentJob2)
  if (input.emergencyContact !== undefined) out.emergencyContact = upper(input.emergencyContact)
  if (input.allergies !== undefined) out.allergies = upper(input.allergies)
  if (input.medicalNotes !== undefined) out.medicalNotes = upper(input.medicalNotes)

  return out
}

/** Prochain numéro de code pour une classe / année (1, 2, 3… par classe). */
export async function getNextClassCode(classId: number, yearId: number): Promise<number> {
  const enrollments = await prisma.enrollment.findMany({
    where: { classId, yearId },
    include: { student: { select: { code: true } } },
  })

  let maxCode = 0
  for (const enrollment of enrollments) {
    const code = enrollment.student?.code
    if (!code) continue
    const num = parseInt(String(code).replace(/\D/g, ""), 10)
    if (!isNaN(num) && num > maxCode) maxCode = num
  }

  return maxCode + 1
}

/** Vérifie si un code est déjà pris dans la même classe et la même année. */
export async function isCodeUsedInClass(
  classId: number,
  yearId: number,
  code: string,
  excludeStudentId?: number
): Promise<boolean> {
  const trimmed = code.trim()
  if (!trimmed) return false

  const existing = await prisma.enrollment.findFirst({
    where: {
      classId,
      yearId,
      student: {
        code: trimmed,
        ...(excludeStudentId ? { id: { not: excludeStudentId } } : {}),
      },
    },
    select: { id: true },
  })

  return !!existing
}
