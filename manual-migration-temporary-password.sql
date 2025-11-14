-- Migration manuelle: Ajouter le champ temporaryPassword
-- Date: 2025-11-14

-- Ajouter le champ temporaryPassword au modèle User
ALTER TABLE `User` ADD COLUMN `temporaryPassword` BOOLEAN NOT NULL DEFAULT false;
