export const STAFF_ROLES = [
  "CAISSIER",
  "COMPTABLE",
  "DIRECTEUR_DISCIPLINE",
  "DIRECTEUR_ETUDES",
] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  CAISSIER: "Caissier(ère)",
  COMPTABLE: "Comptable",
  DIRECTEUR_DISCIPLINE: "Directeur(trice) de discipline",
  DIRECTEUR_ETUDES: "Directeur(trice) des études",
}

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role)
}
