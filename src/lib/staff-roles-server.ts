import { User_role } from "@prisma/client"
import { STAFF_ROLES, type StaffRole } from "@/lib/staff-roles"

/** Rôles personnel reconnus par le client Prisma (évite les erreurs si generate n'a pas été relancé). */
export function getStaffRolesInSchema(): User_role[] {
  const known = new Set(Object.values(User_role))
  return STAFF_ROLES.filter((r) => known.has(r as User_role)) as User_role[]
}

/** Filtre Prisma : tous les utilisateurs hors admin, élève, prof, super-admin. */
export const NON_STAFF_USER_ROLES: User_role[] = [
  User_role.ADMIN,
  User_role.ELEVE,
  User_role.PROFESSEUR,
  User_role.SUPER_ADMIN,
]

export function isStaffRoleInSchema(role: string): role is StaffRole {
  return getStaffRolesInSchema().includes(role as User_role)
}
