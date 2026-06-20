import { prisma } from "@/lib/prisma"

export const DEFAULT_FEE_TYPE_CODE = "FRAIS_SCOLAIRE"
export const DEFAULT_FEE_TYPE_NAME = "Frais scolaire"

export function isDefaultFeeType(type: { code?: string; nom?: string }): boolean {
  if (type.code === DEFAULT_FEE_TYPE_CODE) return true
  const normalized = type.nom
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
  return normalized === "frais scolaire" || normalized === "frais scolaires"
}

export function isDefaultFeeTypeName(nom: string): boolean {
  return isDefaultFeeType({ nom })
}

export async function ensureDefaultFeeType(schoolId: number) {
  const existing = await prisma.typeFrais.findFirst({
    where: { schoolId, code: DEFAULT_FEE_TYPE_CODE },
  })
  if (existing) return existing

  const byName = await prisma.typeFrais.findMany({ where: { schoolId, isActive: true } })
  const match = byName.find((t) => isDefaultFeeType(t))
  if (match) {
    if (match.code !== DEFAULT_FEE_TYPE_CODE) {
      return prisma.typeFrais.update({
        where: { id: match.id },
        data: { code: DEFAULT_FEE_TYPE_CODE },
      })
    }
    return match
  }

  return prisma.typeFrais.create({
    data: {
      schoolId,
      code: DEFAULT_FEE_TYPE_CODE,
      nom: DEFAULT_FEE_TYPE_NAME,
      description: "Frais scolaires annuels (type par défaut)",
      isActive: true,
    },
  })
}

export async function getDefaultFeeTypeId(schoolId: number): Promise<number | null> {
  await ensureDefaultFeeType(schoolId)
  const type = await prisma.typeFrais.findFirst({
    where: { schoolId, code: DEFAULT_FEE_TYPE_CODE, isActive: true },
    select: { id: true },
  })
  return type?.id ?? null
}
