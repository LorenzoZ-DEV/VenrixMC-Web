-- Candidature e appeal collegati all'account di chi li invia, e sblocco
-- manuale del limite di una candidatura ogni 14 giorni.
ALTER TABLE `users` ADD COLUMN `applyCooldownResetAt` DATETIME(3) NULL;

ALTER TABLE `staff_applies` ADD COLUMN `userId` VARCHAR(191) NULL;
CREATE INDEX `staff_applies_userId_createdAt_idx` ON `staff_applies`(`userId`, `createdAt`);
ALTER TABLE `staff_applies` ADD CONSTRAINT `staff_applies_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `appeals` ADD COLUMN `userId` VARCHAR(191) NULL;
CREATE INDEX `appeals_userId_createdAt_idx` ON `appeals`(`userId`, `createdAt`);
ALTER TABLE `appeals` ADD CONSTRAINT `appeals_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
