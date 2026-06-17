/** Lecture des frais, stats, élèves, historique */
export const FEE_VIEW_ROLES = ["ADMIN", "COMPTABLE", "CAISSIER", "SUPER_ADMIN"] as const

/** Enregistrement des paiements (caisse / POS) */
export const FEE_COLLECT_ROLES = ["ADMIN", "COMPTABLE", "CAISSIER", "SUPER_ADMIN"] as const

/** Configuration types, tarifications, suppressions */
export const FEE_CONFIG_ROLES = ["ADMIN", "SUPER_ADMIN"] as const
