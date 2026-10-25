-- Rilevamento AI delle candidature staff tramite ZeroGPT: e' solo un
-- indicatore per chi valuta, non decide niente da solo.
ALTER TABLE `staff_applies`
    ADD COLUMN `aiPercentage` DOUBLE NULL,
    ADD COLUMN `aiSentences` JSON NULL,
    ADD COLUMN `aiCheckedAt` DATETIME(3) NULL,
    ADD COLUMN `aiError` VARCHAR(300) NULL;
