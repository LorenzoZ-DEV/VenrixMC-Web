-- Blacklist candidature staff: chi compare qui non puo inviare candidature.
-- I tre identificatori sono tutti opzionali e indicizzati singolarmente:
-- la ricerca al momento della candidatura fa un OR fra quelli disponibili,
-- quindi ognuno deve poter essere risolto da solo senza scansione.
CREATE TABLE `staff_blacklist` (
  `id` VARCHAR(191) NOT NULL,
  `minecraftUuid` VARCHAR(32) NULL,
  `minecraftName` VARCHAR(16) NULL,
  `discordId` VARCHAR(20) NULL,
  `reason` TEXT NOT NULL,
  `createdById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `staff_blacklist_minecraftUuid_idx`(`minecraftUuid`),
  INDEX `staff_blacklist_minecraftName_idx`(`minecraftName`),
  INDEX `staff_blacklist_discordId_idx`(`discordId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- SetNull: se l'account dello staff che ha creato la voce viene cancellato,
-- la blacklist resta (perde solo l'attribuzione).
ALTER TABLE `staff_blacklist`
  ADD CONSTRAINT `staff_blacklist_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
