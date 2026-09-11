/**
 * Helpers purs pour la complétion du profil élève (première connexion).
 * Safe côté client — aucun import Prisma / Node.
 */

/** Champs obligatoires pour la complétion du profil élève (première connexion). */
export const STUDENT_PROFILE_REQUIRED_FIELDS = [
  "birthPlace",
  "nationality",
  "address",
  "parentName1",
  "parentPhone1",
  "emergencyContact",
  "emergencyPhone",
] as const

export type StudentProfileRequiredField = (typeof STUDENT_PROFILE_REQUIRED_FIELDS)[number]

export const STUDENT_PROFILE_REQUIRED_LABELS: Record<StudentProfileRequiredField, string> = {
  birthPlace: "Lieu de naissance",
  nationality: "Nationalité",
  address: "Adresse résidentielle",
  parentName1: "Nom du parent / tuteur principal",
  parentPhone1: "Téléphone du parent / tuteur principal",
  emergencyContact: "Nom du contact d'urgence",
  emergencyPhone: "Numéro d'urgence",
}

function isFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0
}

export function getMissingStudentProfileFields(
  input: Record<string, unknown>
): StudentProfileRequiredField[] {
  return STUDENT_PROFILE_REQUIRED_FIELDS.filter((key) => !isFilled(input[key]))
}

export function isStudentProfileComplete(input: Record<string, unknown>): boolean {
  return getMissingStudentProfileFields(input).length === 0
}
