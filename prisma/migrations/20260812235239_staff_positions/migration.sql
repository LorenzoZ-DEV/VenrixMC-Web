-- CreateTable
CREATE TABLE `staff_positions` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(500) NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT 'chat',
    `slots` INTEGER NOT NULL DEFAULT 0,
    `open` BOOLEAN NOT NULL DEFAULT true,
    `requirements` JSON NOT NULL,
    `wizardId` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_positions_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
