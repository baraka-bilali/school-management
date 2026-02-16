import { z } from "zod"

// ============================================================
// TYPE DE FRAIS
// ============================================================

export const createTypeFraisSchema = z.object({
  code: z
    .string()
    .min(2, "Le code doit avoir au moins 2 caractères")
    .max(20, "Le code ne peut dépasser 20 caractères")
    .regex(/^[A-Z0-9_]+$/, "Le code ne doit contenir que des majuscules, chiffres et underscores"),
  nom: z.string().min(2, "Le nom doit avoir au moins 2 caractères").max(100),
  description: z.string().optional(),
})

export const updateTypeFraisSchema = createTypeFraisSchema.partial()

// ============================================================
// TARIFICATION
// ============================================================

export const createTarificationSchema = z.object({
  typeFraisId: z.number().int().positive("typeFraisId invalide"),
  yearId: z.number().int().positive("yearId invalide"),
  classId: z.number().int().positive("classId invalide").nullable().optional(),
  montant: z.number().positive("Le montant doit être positif"),
  description: z.string().optional(),
})

export const updateTarificationSchema = z.object({
  montant: z.number().positive("Le montant doit être positif").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// ============================================================
// ECHEANCE
// ============================================================

export const createEcheanceSchema = z.object({
  tarificationId: z.number().int().positive("tarificationId invalide"),
  nom: z.string().min(2, "Le nom doit avoir au moins 2 caractères").max(100),
  montant: z.number().positive("Le montant doit être positif"),
  dateEcheance: z.string().datetime({ message: "Date invalide" }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  ordre: z.number().int().positive().optional(),
})

export const createEcheancesBatchSchema = z.object({
  tarificationId: z.number().int().positive("tarificationId invalide"),
  echeances: z
    .array(
      z.object({
        nom: z.string().min(2).max(100),
        montant: z.number().positive(),
        dateEcheance: z.string(),
        ordre: z.number().int().positive().optional(),
      })
    )
    .min(1, "Au moins une échéance est requise"),
})

export const updateEcheanceSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  montant: z.number().positive().optional(),
  dateEcheance: z.string().optional(),
  ordre: z.number().int().positive().optional(),
})

// ============================================================
// PAIEMENT
// ============================================================

export const createPaiementSchema = z.object({
  enrollmentId: z.number().int().positive("enrollmentId invalide"),
  tarificationId: z.number().int().positive("tarificationId invalide"),
  montant: z.number().positive("Le montant doit être positif"),
  datePaiement: z.string().optional(),
  modePaiement: z.enum(["CASH", "VIREMENT", "MOBILE_MONEY", "CHEQUE", "AUTRE"]).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
})

export const updatePaiementSchema = z.object({
  montant: z.number().positive("Le montant doit être positif").optional(),
  datePaiement: z.string().optional(),
  modePaiement: z.enum(["CASH", "VIREMENT", "MOBILE_MONEY", "CHEQUE", "AUTRE"]).optional(),
  reference: z.string().max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  motif: z.string().min(5, "Le motif de modification doit avoir au moins 5 caractères"),
})

export const annulerPaiementSchema = z.object({
  motifAnnulation: z.string().min(5, "Le motif d'annulation doit avoir au moins 5 caractères"),
})

// ============================================================
// TYPES
// ============================================================

export type CreateTypeFraisInput = z.infer<typeof createTypeFraisSchema>
export type UpdateTypeFraisInput = z.infer<typeof updateTypeFraisSchema>
export type CreateTarificationInput = z.infer<typeof createTarificationSchema>
export type UpdateTarificationInput = z.infer<typeof updateTarificationSchema>
export type CreateEcheanceInput = z.infer<typeof createEcheanceSchema>
export type CreateEcheancesBatchInput = z.infer<typeof createEcheancesBatchSchema>
export type UpdateEcheanceInput = z.infer<typeof updateEcheanceSchema>
export type CreatePaiementInput = z.infer<typeof createPaiementSchema>
export type UpdatePaiementInput = z.infer<typeof updatePaiementSchema>
export type AnnulerPaiementInput = z.infer<typeof annulerPaiementSchema>
