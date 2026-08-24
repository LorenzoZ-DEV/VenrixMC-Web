-- AlterTable
ALTER TABLE `appeals` ADD COLUMN `discord` VARCHAR(40) NULL,
    ADD COLUMN `discordId` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `staff_applies` ADD COLUMN `discordId` VARCHAR(20) NULL;
