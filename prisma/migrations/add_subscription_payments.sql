-- Migration: Système de paiements d'abonnement + factures

-- 1. Ajout des nouveaux types dans l'enum NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_PAYMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_CANCELLED';

-- 2. Table des paiements d'abonnement
CREATE TABLE IF NOT EXISTS "SubscriptionPayment" (
  "id"            SERIAL PRIMARY KEY,
  "schoolId"      INTEGER NOT NULL,
  "montant"       DOUBLE PRECISION NOT NULL,
  "devise"        TEXT NOT NULL DEFAULT 'USD',
  "typePaiement"  TEXT NOT NULL,
  "reference"     TEXT,
  "dateDebut"     TIMESTAMP(3) NOT NULL,
  "dateFin"       TIMESTAMP(3) NOT NULL,
  "periode"       TEXT NOT NULL,
  "plan"          TEXT NOT NULL,
  "numeroFacture" TEXT NOT NULL,
  "notes"         TEXT,
  "statut"        TEXT NOT NULL DEFAULT 'ACTIF',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById"   INTEGER,
  CONSTRAINT "SubscriptionPayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SubscriptionPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SubscriptionPayment_numeroFacture_key" UNIQUE ("numeroFacture")
);

CREATE INDEX IF NOT EXISTS "SubscriptionPayment_schoolId_idx" ON "SubscriptionPayment"("schoolId");
CREATE INDEX IF NOT EXISTS "SubscriptionPayment_createdAt_idx" ON "SubscriptionPayment"("createdAt");
CREATE INDEX IF NOT EXISTS "SubscriptionPayment_numeroFacture_idx" ON "SubscriptionPayment"("numeroFacture");

-- 3. Compteur de numéros de facture
CREATE TABLE IF NOT EXISTS "SubscriptionInvoiceCounter" (
  "id"        SERIAL PRIMARY KEY,
  "year"      INTEGER NOT NULL,
  "counter"   INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubscriptionInvoiceCounter_year_key" UNIQUE ("year")
);
