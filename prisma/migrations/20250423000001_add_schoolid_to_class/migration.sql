-- Step 1: Add schoolId as NULLABLE first
ALTER TABLE `Class` ADD COLUMN `schoolId` INTEGER NULL;

-- Step 2: Update all existing classes to use the first available school ID
-- Get the minimum school ID and assign it to all existing classes
UPDATE `Class` SET `schoolId` = (SELECT MIN(id) FROM `School`) WHERE `schoolId` IS NULL;

-- Step 3: Make schoolId NOT NULL now that all records have a value
ALTER TABLE `Class` MODIFY COLUMN `schoolId` INTEGER NOT NULL;

-- Step 4: Create index
CREATE INDEX `Class_schoolId_idx` ON `Class`(`schoolId`);

-- Step 5: Add foreign key constraint
ALTER TABLE `Class` ADD CONSTRAINT `Class_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Drop old unique constraint on name only
ALTER TABLE `Class` DROP INDEX `Class_name_key`;

-- Step 7: Create new composite unique constraint on name + schoolId
CREATE UNIQUE INDEX `Class_name_schoolId_key` ON `Class`(`name`, `schoolId`);
