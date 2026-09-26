-- Passaggio da 4 ruoli alla scala completa dei rank.
-- 'Developer' sparisce e diventa 'Dev': l'ENUM va quindi allargato prima,
-- convertite le righe, e solo dopo si puo togliere il valore vecchio.
-- Owner, Mod e Helper esistono in entrambe le versioni e non si toccano.

-- AlterTable: enum di transizione (nuovi valori + il vecchio 'Developer')
ALTER TABLE `staff_members` MODIFY `role` ENUM(
    'Owner', 'SrDev', 'Dev', 'JrDev', 'Manager', 'SrAdmin', 'Admin',
    'SrMod', 'ModPlus', 'Mod', 'SrHelper', 'Helper', 'Trainee',
    'Developer'
) NOT NULL;

-- Converte le righe esistenti
UPDATE `staff_members` SET `role` = 'Dev' WHERE `role` = 'Developer';

-- AlterTable: enum definitivo, senza il valore legacy
ALTER TABLE `staff_members` MODIFY `role` ENUM(
    'Owner', 'SrDev', 'Dev', 'JrDev', 'Manager', 'SrAdmin', 'Admin',
    'SrMod', 'ModPlus', 'Mod', 'SrHelper', 'Helper', 'Trainee'
) NOT NULL;
