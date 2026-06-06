-- Migration: Ajout du champ targetRole sur la table Notification
-- À exécuter dans Supabase Dashboard → SQL Editor

-- 1. Créer l'enum NotificationTarget (sans erreur si déjà existant)
DO $$ BEGIN
  CREATE TYPE "NotificationTarget" AS ENUM ('SUPER_ADMIN_ONLY', 'SCHOOL_USER_ONLY', 'ALL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ajouter la colonne targetRole avec valeur par défaut 'ALL'
ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "targetRole" "NotificationTarget" NOT NULL DEFAULT 'ALL';

-- 3. Ajouter l'index pour la performance
CREATE INDEX IF NOT EXISTS "Notification_targetRole_isRead_idx"
  ON "Notification" ("targetRole", "isRead");

-- 4. Mettre à jour les notifications existantes selon le contexte :
--    - userId IS NULL → destinées au Super Admin
--    - userId IS NOT NULL → destinées aux utilisateurs d'école
UPDATE "Notification"
  SET "targetRole" = 'SUPER_ADMIN_ONLY'
  WHERE "userId" IS NULL;

UPDATE "Notification"
  SET "targetRole" = 'SCHOOL_USER_ONLY'
  WHERE "userId" IS NOT NULL;
