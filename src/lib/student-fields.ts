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

/** Champs obligatoires pour la complétion du profil élève (première connexion). */
export function isStudentProfileComplete(input: Record<string, unknown>): boolean {
  const required = [
    "birthPlace",
    "nationality",
    "address",
    "parentName1",
    "parentPhone1",
    "emergencyContact",
    "emergencyPhone",
  ] as const
  return required.every((key) => {
    const value = input[key]
    return typeof value === "string" && value.trim().length > 0
  })
}

const CLASS_CODE_SEP = ":"

export type ParsedStoredCode = {
  classId?: number
  yearId?: number
  display: string
}

/** Décode un code stocké : « 12:3:1 » (classe:année:affichage) ou ancien « 12:1 ». */
export function parseStoredCode(stored: string | null | undefined): ParsedStoredCode {
  if (!stored) return { display: "" }
  const str = String(stored)
  const parts = str.split(CLASS_CODE_SEP)
  if (parts.length >= 3 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
    return {
      classId: Number(parts[0]),
      yearId: Number(parts[1]),
      display: parts.slice(2).join(CLASS_CODE_SEP),
    }
  }
  if (parts.length === 2 && /^\d+$/.test(parts[0])) {
    return { classId: Number(parts[0]), display: parts[1] }
  }
  return { display: str }
}

/** Numéro affiché (1, 2, 3…) depuis le code stocké. */
export function toDisplayCode(
  stored: string | null | undefined,
  classId?: number,
  yearId?: number
): string {
  const parsed = parseStoredCode(stored)
  if (!parsed.display) return ""

  if (classId !== undefined && parsed.classId !== undefined && parsed.classId !== classId) {
    return parsed.display
  }

  // Nouveau format : le numéro n'appartient qu'à une année précise
  if (yearId !== undefined && parsed.yearId !== undefined && parsed.yearId !== yearId) {
    return ""
  }

  return parsed.display
}

/**
 * Préfixe classe + année pour unicité globale en BDD.
 * Affichage : 1, 2, 3… par classe et par année scolaire.
 */
export function toStoredCode(classId: number, displayCode: string, yearId?: number): string {
  const display = displayCode.trim()
  if (!display) return display

  const parsed = parseStoredCode(display)
  if (parsed.yearId != null && parsed.classId === classId) {
    return `${classId}${CLASS_CODE_SEP}${parsed.yearId}${CLASS_CODE_SEP}${parsed.display}`
  }

  if (yearId != null) {
    return `${classId}${CLASS_CODE_SEP}${yearId}${CLASS_CODE_SEP}${display}`
  }

  // Ancien format sans année (rétrocompatibilité lecture seule)
  const sep = display.lastIndexOf(CLASS_CODE_SEP)
  if (sep >= 0 && display.slice(0, sep) === String(classId)) {
    return display
  }
  return `${classId}${CLASS_CODE_SEP}${display}`
}

export function studentWithDisplayCode<
  T extends { code: string | null; enrollments?: Array<{ classId?: number; yearId?: number }> },
>(student: T, classId?: number, yearId?: number): T {
  const resolvedClassId = classId ?? student.enrollments?.[0]?.classId
  const resolvedYearId = yearId ?? student.enrollments?.[0]?.yearId
  return {
    ...student,
    code: toDisplayCode(student.code, resolvedClassId, resolvedYearId),
  }
}

/** Prochain numéro de code pour une classe / année (1, 2, 3… par classe et par année). */
export async function getNextClassCode(classId: number, yearId: number): Promise<number> {
  const enrollments = await prisma.enrollment.findMany({
    where: { classId, yearId },
    include: { student: { select: { code: true } } },
  })

  let maxCode = 0
  for (const enrollment of enrollments) {
    const code = enrollment.student?.code
    if (!code) continue
    const display = toDisplayCode(code, classId, yearId)
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

  const stored = toStoredCode(classId, trimmed, yearId)

  const sameStored = await prisma.student.findFirst({
    where: {
      code: stored,
      ...(excludeStudentId ? { id: { not: excludeStudentId } } : {}),
    },
    select: { id: true },
  })
  if (sameStored) return true

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
    return (
      sc === stored ||
      toDisplayCode(sc, classId, yearId) === trimmed
    )
  })
}
