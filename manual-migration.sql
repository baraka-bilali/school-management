-- AlterEnum: Add new values to User_role
ALTER TABLE `User` MODIFY COLUMN `role` ENUM('ADMIN', 'ELEVE', 'COMPTABLE', 'PROFESSEUR', 'DIRECTEUR_DISCIPLINE', 'DIRECTEUR_ETUDES', 'SUPER_ADMIN') NOT NULL DEFAULT 'ELEVE';

-- CreateTable: School
CREATE TABLE IF NOT EXISTS `School` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` INTEGER NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `School_name_key`(`name`),
    UNIQUE INDEX `School_code_key`(`code`),
    INDEX `School_createdById_fkey`(`createdById`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `School` ADD CONSTRAINT `School_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
