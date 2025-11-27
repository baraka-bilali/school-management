-- Migration manuelle: Ajout des champs d'abonnement
-- Date: 2025-11-27

ALTER TABLE `School` 
ADD COLUMN `dateDebutAbonnement` DATETIME(3) NULL AFTER `dateModification`,
ADD COLUMN `typePaiement` VARCHAR(191) NULL AFTER `planAbonnement`,
ADD COLUMN `montantPaye` DOUBLE NULL AFTER `typePaiement`;
