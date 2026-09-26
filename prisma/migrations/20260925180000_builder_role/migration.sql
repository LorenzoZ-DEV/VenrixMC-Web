-- Ruolo Capo Builder: accede alla dashboard solo per le candidature Builder.
ALTER TABLE `users` MODIFY `role` ENUM('MEMBER', 'BUILDER', 'STAFF', 'HEAD', 'ADMIN', 'DEVELOPER') NOT NULL DEFAULT 'STAFF';
ALTER TABLE `forum_boards` MODIFY `readRole` ENUM('MEMBER', 'BUILDER', 'STAFF', 'HEAD', 'ADMIN', 'DEVELOPER') NULL;
ALTER TABLE `forum_boards` MODIFY `postRole` ENUM('MEMBER', 'BUILDER', 'STAFF', 'HEAD', 'ADMIN', 'DEVELOPER') NULL;
