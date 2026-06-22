export type StudentCreateField =
  | "lastName"
  | "firstName"
  | "birthDate"
  | "classId"
  | "academicYearId"
  | "code"

export type StudentCreateValidationResult =
  | { ok: true; birthDate: Date; classId: number; yearId: number }
  | { ok: false; error: string; field?: StudentCreateField }

export function parseBirthDate(value: unknown): Date | null {
  if (value == null || value === "") return null
  if (typeof value !== "string") return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function validateStudentCreateInput(input: {
  lastName?: string
  firstName?: string
  birthDate?: unknown
  classId?: unknown
  academicYearId?: unknown
}): StudentCreateValidationResult {
  const lastName = (input.lastName ?? "").trim()
  const firstName = (input.firstName ?? "").trim()

  if (!lastName) {
    return { ok: false, error: "Le nom est obligatoire", field: "lastName" }
  }
  if (!firstName) {
    return { ok: false, error: "Le prénom est obligatoire", field: "firstName" }
  }

  const birthDate = parseBirthDate(input.birthDate)
  if (!birthDate) {
    return {
      ok: false,
      error: "La date de naissance est obligatoire",
      field: "birthDate",
    }
  }

  const classId = Number(input.classId)
  if (!input.classId || Number.isNaN(classId) || classId <= 0) {
    return { ok: false, error: "La classe est obligatoire", field: "classId" }
  }

  const yearId = Number(input.academicYearId)
  if (!input.academicYearId || Number.isNaN(yearId) || yearId <= 0) {
    return {
      ok: false,
      error: "L'année académique est obligatoire",
      field: "academicYearId",
    }
  }

  return { ok: true, birthDate, classId, yearId }
}
