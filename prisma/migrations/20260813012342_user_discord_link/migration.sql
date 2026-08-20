-- AlterTable
ALTER TABLE `users` ADD COLUMN `discordId` VARCHAR(191) NULL,
    ADD COLUMN `discordUsername` VARCHAR(191) NULL,
    ADD COLUMN `discordAvatar` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_discordId_key` ON `users`(`discordId`);
