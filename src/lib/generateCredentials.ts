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

export function buildStudentEmail({ lastName, middleName, code }: { lastName: string; middleName: string; code: string }): string {
  const left = `${initial(lastName)}${initial(middleName)}${normalize(code)}`
  return `${left}@${DEFAULT_DOMAIN}`
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


