-- Sotto-sezioni del forum: un forum puo stare dentro un altro forum della
-- stessa categoria.
--
-- ON DELETE SET NULL e voluto: cancellare il padre non deve portarsi via le
-- discussioni delle figlie, che risalgono invece al primo livello. L'API
-- rifiuta comunque la cancellazione finche esistono sotto-sezioni collegate,
-- quindi questo vincolo e solo la rete di sicurezza al livello del database.

-- AlterTable
ALTER TABLE `forum_boards` ADD COLUMN `parentId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `forum_boards_parentId_order_idx` ON `forum_boards`(`parentId`, `order`);

-- AddForeignKey
ALTER TABLE `forum_boards` ADD CONSTRAINT `forum_boards_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `forum_boards`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
