-- Migration manuelle: Ajouter les champs pour les administrateurs d'école
-- Date: 2025-11-14

-- Ajouter les nouveaux champs au modèle User
ALTER TABLE `User` ADD COLUMN `nom` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `prenom` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `telephone` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `fonction` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `schoolId` INTEGER NULL;
ALTER TABLE `User` ADD COLUMN `dateCreation` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Ajouter la contrainte de clé étrangère
ALTER TABLE `User` ADD CONSTRAINT `User_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Créer un index sur schoolId pour améliorer les performances
CREATE INDEX `User_schoolId_idx` ON `User`(`schoolId`);
