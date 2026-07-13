-- Rôles personnel (structure RDC) + paiements salaires personnel

ALTER TYPE "User_role" ADD VALUE IF NOT EXISTS 'DIRECTEUR_ADJOINT';
ALTER TYPE "User_role" ADD VALUE IF NOT EXISTS 'SECRETAIRE';
ALTER TYPE "User_role" ADD VALUE IF NOT EXISTS 'INTENDANT';
ALTER TYPE "User_role" ADD VALUE IF NOT EXISTS 'SURVEILLANT_GENERAL';
ALTER TYPE "User_role" ADD VALUE IF NOT EXISTS 'BIBLIOTHECAIRE';
ALTER TYPE "User_role" ADD VALUE IF NOT EXISTS 'INFIRMIER';
ALTER TYPE "User_role" ADD VALUE IF NOT EXISTS 'CONSEILLER_PEDAGOGIQUE';

CREATE TABLE IF NOT EXISTS "StaffPayment" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "montant" DOUBLE PRECISION NOT NULL,
  "type" "PaymentType" NOT NULL DEFAULT 'SALAIRE',
  "mois" TEXT NOT NULL,
  "description" TEXT,
  "modePaiement" "ModePaiement" NOT NULL DEFAULT 'CASH',
  "reference" TEXT,
  "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StaffPayment_schoolId_idx" ON "StaffPayment"("schoolId");
CREATE INDEX IF NOT EXISTS "StaffPayment_userId_idx" ON "StaffPayment"("userId");
CREATE INDEX IF NOT EXISTS "StaffPayment_datePaiement_idx" ON "StaffPayment"("datePaiement");
CREATE INDEX IF NOT EXISTS "StaffPayment_schoolId_mois_idx" ON "StaffPayment"("schoolId", "mois");
