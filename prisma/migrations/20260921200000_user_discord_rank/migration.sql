-- Rank staff sincronizzato dai ruoli Discord al login.
ALTER TABLE `users` ADD COLUMN `discordRank` ENUM(
    'Owner', 'SrDev', 'Dev', 'JrDev', 'Manager', 'SrAdmin', 'Admin',
    'SrMod', 'ModPlus', 'Mod', 'SrHelper', 'Helper', 'Trainee', 'Builder'
) NULL;
