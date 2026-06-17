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

const CLASS_CODE_SEP = ":"

/** Numéro affiché (1, 2, 3…) depuis le code stocké (ex. « 42:1 » → « 1 »). */
export function toDisplayCode(stored: string | null | undefined, classId?: number): string {
  if (!stored) return ""
  const str = String(stored)
  const sep = str.lastIndexOf(CLASS_CODE_SEP)
  if (sep >= 0) {
    if (classId !== undefined && str.slice(0, sep) !== String(classId)) {
      return str.slice(sep + 1)
    }
    return str.slice(sep + 1)
  }
  return str
}

/** Préfixe par classe pour l'unicité globale en BDD tout en affichant 1, 2, 3… par classe. */
export function toStoredCode(classId: number, displayCode: string): string {
  const display = displayCode.trim()
  if (!display) return display
  const sep = display.lastIndexOf(CLASS_CODE_SEP)
  if (sep >= 0 && display.slice(0, sep) === String(classId)) {
    return display
  }
  return `${classId}${CLASS_CODE_SEP}${display}`
}

export function studentWithDisplayCode<
  T extends { code: string | null; enrollments?: Array<{ classId?: number }> },
>(student: T, classId?: number): T {
  const resolvedClassId = classId ?? student.enrollments?.[0]?.classId
  return {
    ...student,
    code: toDisplayCode(student.code, resolvedClassId),
  }
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
    const display = toDisplayCode(code, classId)
    const num = parseInt(display.replace(/\D/g, ""), 10)
    if (!isNaN(num) && num > maxCode) maxCode = num
  }

  return maxCode + 1
}

/** Vérifie si un code est déjà pris dans la même classe et la même année. */
export async function isCodeUsedInClass(
  classId: number,
  yearId: number,
  displayCode: string,
  excludeStudentId?: number
): Promise<boolean> {
  const trimmed = displayCode.trim()
  if (!trimmed) return false

  const stored = toStoredCode(classId, trimmed)
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      yearId,
      ...(excludeStudentId ? { studentId: { not: excludeStudentId } } : {}),
    },
    include: { student: { select: { code: true } } },
  })

  return enrollments.some((e) => {
    const sc = e.student?.code ?? ""
    return sc === stored || sc === trimmed || toDisplayCode(sc, classId) === trimmed
  })
}
