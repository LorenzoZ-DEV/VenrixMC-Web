-- Esito della candidatura orale: la scritta accettata (APPROVED) resta in
-- attesa del colloquio, che lo staff chiude con uno di questi due stati.
ALTER TABLE `staff_applies` MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'INTERVIEW_PASSED', 'INTERVIEW_REJECTED') NOT NULL DEFAULT 'PENDING';
