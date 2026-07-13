export const STAFF_ROLES = [
  "CAISSIER",
  "COMPTABLE",
  "DIRECTEUR_DISCIPLINE",
  "DIRECTEUR_ETUDES",
  "DIRECTEUR_ADJOINT",
  "SECRETAIRE",
  "INTENDANT",
  "SURVEILLANT_GENERAL",
  "BIBLIOTHECAIRE",
  "INFIRMIER",
  "CONSEILLER_PEDAGOGIQUE",
] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

/** Rôles toujours présents avant migration étendue (fallback UI). */
export const STAFF_ROLES_CORE: StaffRole[] = [
  "CAISSIER",
  "COMPTABLE",
  "DIRECTEUR_DISCIPLINE",
  "DIRECTEUR_ETUDES",
]

/** Rôles avec accès à l'espace personnel /staff (tous les personnels non enseignants) */
export const STAFF_PORTAL_ROLES = STAFF_ROLES

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  CAISSIER: "Caissier(ère)",
  COMPTABLE: "Comptable",
  DIRECTEUR_DISCIPLINE: "Directeur(trice) de discipline",
  DIRECTEUR_ETUDES: "Directeur(trice) des études",
  DIRECTEUR_ADJOINT: "Directeur(trice) adjoint(e)",
  SECRETAIRE: "Secrétaire",
  INTENDANT: "Intendant(e)",
  SURVEILLANT_GENERAL: "Surveillant(e) général(e)",
  BIBLIOTHECAIRE: "Bibliothécaire",
  INFIRMIER: "Infirmier(ère) scolaire",
  CONSEILLER_PEDAGOGIQUE: "Conseiller(ère) pédagogique",
}

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role)
}

export function isStaffPortalRole(role: string): role is StaffRole {
  return isStaffRole(role)
}

export function getStaffRoleLabel(role: string): string {
  if (isStaffRole(role)) return STAFF_ROLE_LABELS[role]
  return role
}
