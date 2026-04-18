-- Migration: Trésorerie - Salaires professeurs et dépenses école
-- Exécuter ce SQL dans phpMyAdmin sur Hostinger

CREATE TABLE IF NOT EXISTS `TeacherPayment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teacherId` INT NOT NULL,
  `schoolId` INT NOT NULL,
  `montant` DOUBLE NOT NULL,
  `type` ENUM('SALAIRE', 'PRIME', 'BONUS', 'AVANCE', 'AUTRE') NOT NULL DEFAULT 'SALAIRE',
  `mois` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `modePaiement` ENUM('CASH', 'VIREMENT', 'MOBILE_MONEY', 'CHEQUE', 'AUTRE') NOT NULL DEFAULT 'CASH',
  `reference` VARCHAR(191) NULL,
  `datePaiement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `TeacherPayment_schoolId_idx` (`schoolId`),
  INDEX `TeacherPayment_teacherId_idx` (`teacherId`),
  INDEX `TeacherPayment_datePaiement_idx` (`datePaiement`),
  INDEX `TeacherPayment_schoolId_mois_idx` (`schoolId`, `mois`),
  CONSTRAINT `TeacherPayment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SchoolExpense` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `schoolId` INT NOT NULL,
  `categorie` ENUM('FOURNITURES', 'EQUIPEMENT', 'MAINTENANCE', 'TRANSPORT', 'COMMUNICATION', 'EVENEMENT', 'AUTRE') NOT NULL DEFAULT 'AUTRE',
  `motif` TEXT NOT NULL,
  `montant` DOUBLE NOT NULL,
  `beneficiaire` VARCHAR(191) NULL,
  `modePaiement` ENUM('CASH', 'VIREMENT', 'MOBILE_MONEY', 'CHEQUE', 'AUTRE') NOT NULL DEFAULT 'CASH',
  `reference` VARCHAR(191) NULL,
  `dateDepense` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `SchoolExpense_schoolId_idx` (`schoolId`),
  INDEX `SchoolExpense_dateDepense_idx` (`dateDepense`),
  INDEX `SchoolExpense_schoolId_categorie_idx` (`schoolId`, `categorie`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
