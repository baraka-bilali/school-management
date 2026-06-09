-- Nettoyer les données de test pour l'école ID 1 (Collège Don Bosco)
-- Exécuter dans Supabase SQL Editor

-- 1. Supprimer toutes les notifications liées à l'école
DELETE FROM "Notification" WHERE "schoolId" = 1;

-- 2. Supprimer tous les paiements d'abonnement de l'école
DELETE FROM "SubscriptionPayment" WHERE "schoolId" = 1;

-- 3. Remettre à zéro les champs abonnement de l'école
UPDATE "School" SET
  "etatCompte"           = 'EN_ATTENTE',
  "dateDebutAbonnement"  = NULL,
  "dateFinAbonnement"    = NULL,
  "planAbonnement"       = NULL,
  "typePaiement"         = NULL,
  "montantPaye"          = NULL,
  "periodeAbonnement"    = NULL
WHERE "id" = 1;

-- 4. Remettre le compteur de factures à 0 (optionnel)
UPDATE "SubscriptionInvoiceCounter" SET "counter" = 0 WHERE "year" = 2026;

-- Vérification
SELECT id, "nomEtablissement", "etatCompte", "dateDebutAbonnement", "dateFinAbonnement"
FROM "School" WHERE "id" = 1;
