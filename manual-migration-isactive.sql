-- Migration manuelle: Ajouter le champ isActive
-- Date: 2025-11-14

-- Ajouter le champ isActive au modèle User
ALTER TABLE `User` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;
