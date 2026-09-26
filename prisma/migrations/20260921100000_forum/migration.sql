-- Forum: categorie > forum > discussioni > post, piu etichette e reazioni.
--
-- Tocca anche `users`, perche da qui in poi quella tabella non contiene solo
-- account staff: chi si registra dal forum con Discord nasce come MEMBER e
-- non ha password, quindi `passwordHash` diventa nullable.

-- AlterTable: nuovo gradino piu basso nella scala dei ruoli
ALTER TABLE `users` MODIFY `role` ENUM('MEMBER', 'STAFF', 'HEAD', 'ADMIN', 'DEVELOPER') NOT NULL DEFAULT 'STAFF';

-- AlterTable: profilo forum + login senza password
ALTER TABLE `users`
    MODIFY `passwordHash` VARCHAR(191) NULL,
    ADD COLUMN `minecraftName` VARCHAR(16) NULL,
    ADD COLUMN `bio` VARCHAR(1000) NULL,
    ADD COLUMN `signature` VARCHAR(300) NULL,
    ADD COLUMN `postCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastSeenAt` DATETIME(3) NULL,
    ADD COLUMN `forumMuted` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `users_role_idx` ON `users`(`role`);

-- CreateTable
CREATE TABLE `forum_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(300) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `forum_categories_slug_key`(`slug`),
    INDEX `forum_categories_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forum_boards` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT 'chat',
    `order` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `readRole` ENUM('MEMBER', 'STAFF', 'HEAD', 'ADMIN', 'DEVELOPER') NULL,
    `postRole` ENUM('MEMBER', 'STAFF', 'HEAD', 'ADMIN', 'DEVELOPER') NULL,
    `locked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `forum_boards_slug_key`(`slug`),
    INDEX `forum_boards_categoryId_order_idx`(`categoryId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forum_tags` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT 'venrix',
    `description` VARCHAR(200) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `staffOnly` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `forum_tags_slug_key`(`slug`),
    INDEX `forum_tags_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forum_topics` (
    `id` VARCHAR(191) NOT NULL,
    `boardId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `locked` BOOLEAN NOT NULL DEFAULT false,
    `views` INTEGER NOT NULL DEFAULT 0,
    `replyCount` INTEGER NOT NULL DEFAULT 0,
    `lastPostAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastPostById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `forum_topics_slug_key`(`slug`),
    INDEX `forum_topics_boardId_pinned_lastPostAt_idx`(`boardId`, `pinned`, `lastPostAt`),
    INDEX `forum_topics_lastPostAt_idx`(`lastPostAt`),
    INDEX `forum_topics_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forum_posts` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `opening` BOOLEAN NOT NULL DEFAULT false,
    `editedAt` DATETIME(3) NULL,
    `editedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `forum_posts_topicId_createdAt_idx`(`topicId`, `createdAt`),
    INDEX `forum_posts_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forum_reactions` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('LIKE', 'LOVE', 'LAUGH', 'AGREE') NOT NULL DEFAULT 'LIKE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `forum_reactions_userId_idx`(`userId`),
    UNIQUE INDEX `forum_reactions_postId_userId_key`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: etichette abilitate su un forum (vuoto = ovunque)
CREATE TABLE `_ForumBoardTags` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ForumBoardTags_AB_unique`(`A`, `B`),
    INDEX `_ForumBoardTags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: etichette applicate a una discussione
CREATE TABLE `_ForumTopicTags` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ForumTopicTags_AB_unique`(`A`, `B`),
    INDEX `_ForumTopicTags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `forum_boards` ADD CONSTRAINT `forum_boards_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `forum_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forum_topics` ADD CONSTRAINT `forum_topics_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `forum_boards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forum_topics` ADD CONSTRAINT `forum_topics_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forum_topics` ADD CONSTRAINT `forum_topics_lastPostById_fkey` FOREIGN KEY (`lastPostById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forum_posts` ADD CONSTRAINT `forum_posts_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `forum_topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forum_posts` ADD CONSTRAINT `forum_posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forum_posts` ADD CONSTRAINT `forum_posts_editedById_fkey` FOREIGN KEY (`editedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forum_reactions` ADD CONSTRAINT `forum_reactions_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `forum_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forum_reactions` ADD CONSTRAINT `forum_reactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ForumBoardTags` ADD CONSTRAINT `_ForumBoardTags_A_fkey` FOREIGN KEY (`A`) REFERENCES `forum_boards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ForumBoardTags` ADD CONSTRAINT `_ForumBoardTags_B_fkey` FOREIGN KEY (`B`) REFERENCES `forum_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ForumTopicTags` ADD CONSTRAINT `_ForumTopicTags_A_fkey` FOREIGN KEY (`A`) REFERENCES `forum_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ForumTopicTags` ADD CONSTRAINT `_ForumTopicTags_B_fkey` FOREIGN KEY (`B`) REFERENCES `forum_topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
