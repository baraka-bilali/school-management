import { prisma } from "@/lib/prisma"

// Réexport des helpers purs (client-safe) pour les routes API / serveur.
export {
  STUDENT_PROFILE_REQUIRED_FIELDS,
  STUDENT_PROFILE_REQUIRED_LABELS,
  getMissingStudentProfileFields,
  isStudentProfileComplete,
  type StudentProfileRequiredField,
} from "@/lib/student-profile-completion"

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

/** Numéro affiché dans la classe pour une inscription (ex: "1", "12"). */
export function toDisplayCode(code: string | null | undefined): string {
  if (!code) return ""
  return String(code).trim()
}

/**
 * Attache le code d'affichage de l'inscription courante sur l'élève
 * (compat UI qui attend encore `student.code`).
 */
export function studentWithDisplayCode<
  T extends {
    permanentCode?: string | null
    enrollments?: Array<{ code?: string | null; classId?: number; yearId?: number }>
  },
>(student: T, _classId?: number, _yearId?: number): T & { code: string } {
  const enrollmentCode = student.enrollments?.[0]?.code
  return {
    ...student,
    code: toDisplayCode(enrollmentCode) || toDisplayCode(student.permanentCode),
  }
}

/** Prochain numéro de code pour une classe / année (1, 2, 3…). */
export async function getNextClassCode(classId: number, yearId: number): Promise<number> {
  const enrollments = await prisma.enrollment.findMany({
    where: { classId, yearId },
    select: { code: true },
  })

  let maxCode = 0
  for (const enrollment of enrollments) {
    const display = toDisplayCode(enrollment.code)
    if (!display) continue
    const num = parseInt(display.replace(/\D/g, ""), 10)
    if (!isNaN(num) && num > maxCode) maxCode = num
  }

  let candidate = maxCode + 1
  while (await isCodeUsedInClass(classId, yearId, String(candidate))) {
    candidate++
  }
  return candidate
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

  const existing = await prisma.enrollment.findFirst({
    where: {
      classId,
      yearId,
      code: trimmed,
      ...(excludeStudentId ? { studentId: { not: excludeStudentId } } : {}),
    },
    select: { id: true },
  })
  return Boolean(existing)
}

/** Génère un matricule permanent unique (ELV-{schoolId}-{n}). */
export async function generatePermanentCode(schoolId: number): Promise<string> {
  const prefix = `ELV-${schoolId}-`
  const students = await prisma.student.findMany({
    where: {
      permanentCode: { startsWith: prefix },
      user: { schoolId },
    },
    select: { permanentCode: true },
  })

  let max = 0
  for (const s of students) {
    const suffix = s.permanentCode.slice(prefix.length)
    const n = parseInt(suffix, 10)
    if (!isNaN(n) && n > max) max = n
  }

  let candidate = max + 1
  // Collision safety
  while (
    await prisma.student.findUnique({
      where: { permanentCode: `${prefix}${candidate}` },
      select: { id: true },
    })
  ) {
    candidate++
  }
  return `${prefix}${candidate}`
}
