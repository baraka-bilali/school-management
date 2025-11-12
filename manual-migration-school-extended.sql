-- Migration manuelle pour étendre le modèle School
-- Date: 2025-11-12

-- Supprimer l'ancienne table School
DROP TABLE IF EXISTS `School`;

-- Créer la nouvelle table School avec tous les champs
CREATE TABLE `School` (
  `id` INT NOT NULL AUTO_INCREMENT,
  
  -- Informations générales
  `nomEtablissement` VARCHAR(255) NOT NULL,
  `typeEtablissement` ENUM('PUBLIC', 'PRIVE', 'SEMI_PRIVE') NOT NULL DEFAULT 'PRIVE',
  `niveauEnseignement` JSON NULL,
  `codeEtablissement` VARCHAR(100) NULL UNIQUE,
  `anneeCreation` INT NULL,
  `slogan` TEXT NULL,
  `logoUrl` VARCHAR(500) NULL,
  `statutJuridique` VARCHAR(255) NULL,
  
  -- Informations légales
  `rccm` VARCHAR(100) NULL,
  `idNat` VARCHAR(100) NULL,
  `nif` VARCHAR(100) NULL,
  `agrementMinisteriel` VARCHAR(100) NULL,
  `dateAgrement` DATETIME NULL,
  `ministereTutelle` VARCHAR(255) NULL,
  `statutsReglements` VARCHAR(500) NULL,
  `responsableLegal` VARCHAR(255) NULL,
  `pieceIdentiteResponsable` VARCHAR(255) NULL,
  
  -- Localisation
  `adresse` VARCHAR(500) NOT NULL,
  `ville` VARCHAR(100) NOT NULL,
  `province` VARCHAR(100) NOT NULL,
  `pays` VARCHAR(100) NOT NULL DEFAULT 'RDC',
  `telephone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `siteWeb` VARCHAR(255) NULL,
  
  -- Direction
  `directeurNom` VARCHAR(255) NOT NULL,
  `directeurTelephone` VARCHAR(50) NOT NULL,
  `directeurEmail` VARCHAR(255) NULL,
  `secretaireAcademique` VARCHAR(255) NULL,
  `comptable` VARCHAR(255) NULL,
  `personnelAdministratifTotal` INT NULL,
  
  -- Académique
  `cycles` VARCHAR(500) NULL,
  `nombreClasses` INT NULL,
  `nombreEleves` INT NULL,
  `nombreEnseignants` INT NULL,
  `langueEnseignement` VARCHAR(100) NULL,
  `programmes` TEXT NULL,
  `calendrierScolaire` JSON NULL,
  `joursOuverture` VARCHAR(255) NULL,
  
  -- Paramètres système
  `domaine` VARCHAR(255) NULL,
  `identifiantInterne` VARCHAR(100) NOT NULL UNIQUE,
  `etatCompte` ENUM('ACTIF', 'EN_ATTENTE', 'SUSPENDU') NOT NULL DEFAULT 'EN_ATTENTE',
  `dateInscription` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `derniereMiseAJour` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Historique
  `creeParId` INT NULL,
  `modifieParId` INT NULL,
  `dateCreation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateModification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `School_codeEtablissement_idx` (`codeEtablissement`),
  INDEX `School_email_idx` (`email`),
  INDEX `School_creeParId_fkey` (`creeParId`),
  CONSTRAINT `School_creeParId_fkey` FOREIGN KEY (`creeParId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
