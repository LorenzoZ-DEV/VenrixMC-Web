-- Candidatura annullata: il giocatore si e ritirato. Vale sia sulla scritta
-- che sull'orale, e non e un esito dato dallo staff.
ALTER TABLE `staff_applies` MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'INTERVIEW_PASSED', 'INTERVIEW_REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'PENDING';
