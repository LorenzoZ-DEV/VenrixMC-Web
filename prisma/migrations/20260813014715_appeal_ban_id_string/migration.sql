-- AlterTable
-- banId used to be a plain integer, but this server's LiteBans setup shows
-- players a formatted code (letter prefix + zero-padded id, e.g. "F06494"),
-- so the column now stores that string verbatim.
ALTER TABLE `appeals` MODIFY COLUMN `banId` VARCHAR(20) NULL;
