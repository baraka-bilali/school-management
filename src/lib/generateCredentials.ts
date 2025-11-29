import crypto from "crypto"

const DEFAULT_DOMAIN = process.env.SCHOOL_EMAIL_DOMAIN || "school.local"

export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "")
}

export function initial(input: string): string {
  return normalize(input).slice(0, 1)
}

/**
 * Génère un domaine d'email basé sur le nom de l'école
 * Ex: "École Saint Joseph" -> "ecolesaintjoseph.school"
 */
export function buildSchoolDomain(schoolName: string): string {
  const normalized = schoolName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 30) // Limiter à 30 caractères
  
  return `${normalized}.school`
}

export function buildStudentEmail({ lastName, middleName, code }: { lastName: string; middleName: string; code: string }): string {
  const left = `${initial(lastName)}${initial(middleName)}${normalize(code)}`
  return `${left}@${DEFAULT_DOMAIN}`
}

/**
 * Génère un email pour un élève avec le domaine de l'école
 * Format: initialNom + initialPostnom + code@nomecole.school
 * Ex: "ab001@ecolesaintjoseph.school"
 */
export function buildStudentEmailWithSchool({ 
  lastName, 
  middleName, 
  code, 
  schoolName 
}: { 
  lastName: string; 
  middleName: string; 
  code: string;
  schoolName: string;
}): string {
  const left = `${initial(lastName)}${initial(middleName)}${normalize(code)}`
  const domain = buildSchoolDomain(schoolName)
  return `${left}@${domain}`
}

export function buildTeacherEmail({ lastName, middleName, suffix }: { lastName: string; middleName: string; suffix?: string }): string {
  const left = `${initial(lastName)}${initial(middleName)}${suffix ? normalize(suffix) : ""}`
  return `${left}@${DEFAULT_DOMAIN}`
}

export function generatePassword(): string {
  const length = 14
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let pwd = ""
  while (pwd.length < length) {
    const byte = crypto.randomBytes(1)[0]
    const idx = byte % chars.length
    pwd += chars[idx]
  }
  return pwd
}

/**
 * Génère les identifiants pour un administrateur d'école
 * Format email: admin.nomecole@school.local
 * Mot de passe: Généré automatiquement (14 caractères)
 */
export function generateSchoolCredentials(
  schoolName: string, 
  lastName: string, 
  firstName: string
): { email: string; password: string } {
  // Normaliser le nom de l'école (enlever les accents, espaces, caractères spéciaux)
  const normalizedSchoolName = schoolName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) // Limiter à 20 caractères
  
  // Construire l'email: admin.nomecole@school.local
  const email = `admin.${normalizedSchoolName}@${DEFAULT_DOMAIN}`
  
  // Générer un mot de passe sécurisé
  const password = generatePassword()
  
  return {
    email,
    password
  }
}


