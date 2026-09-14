export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  percent: number
  colorClass: string
  barClass: string
}

/** Heuristique légère pour guider l’utilisateur (min. API = 6 caractères). */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "", percent: 0, colorClass: "text-gray-400", barClass: "bg-gray-200" }
  }

  let raw = 0
  if (password.length >= 6) raw += 1
  if (password.length >= 10) raw += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) raw += 1
  if (/\d/.test(password)) raw += 1
  if (/[^A-Za-z0-9]/.test(password)) raw += 1
  const score = Math.min(4, raw) as 0 | 1 | 2 | 3 | 4

  const meta: Record<1 | 2 | 3 | 4, Omit<PasswordStrength, "score" | "percent">> = {
    1: { label: "Faible", colorClass: "text-rose-600", barClass: "bg-rose-500" },
    2: { label: "Moyen", colorClass: "text-amber-600", barClass: "bg-amber-500" },
    3: { label: "Bon", colorClass: "text-sky-600", barClass: "bg-sky-500" },
    4: { label: "Excellent", colorClass: "text-emerald-600", barClass: "bg-emerald-500" },
  }

  if (score === 0) {
    return {
      score: 0,
      label: "Trop court",
      percent: 15,
      colorClass: "text-rose-500",
      barClass: "bg-rose-400",
    }
  }

  return {
    score,
    percent: score * 25,
    ...meta[score],
  }
}

export function roleWelcomeLabel(role?: string): string {
  switch (role) {
    case "ELEVE":
      return "votre espace élève"
    case "PROFESSEUR":
      return "votre espace enseignant"
    case "PARENT":
      return "votre espace parent"
    case "ADMIN":
    case "DIRECTEUR":
    case "DIRECTEUR_ETUDES":
    case "DIRECTEUR_DISCIPLINE":
      return "votre espace administration"
    case "CAISSIER":
    case "SECRETAIRE":
    case "COMPTABLE":
      return "votre espace personnel"
    default:
      return "Kelasi 360"
  }
}
