-- Aggiunge il rank Builder in fondo alla scala staff.
ALTER TABLE `staff_members` MODIFY `role` ENUM(
    'Owner', 'SrDev', 'Dev', 'JrDev', 'Manager', 'SrAdmin', 'Admin',
    'SrMod', 'ModPlus', 'Mod', 'SrHelper', 'Helper', 'Trainee',
    'Builder'
) NOT NULL;
