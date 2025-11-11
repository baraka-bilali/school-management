-- Mettre à jour le mot de passe du SUPER_ADMIN avec un hash correct
UPDATE `User` 
SET `password` = '$2b$10$D3WYpKSK2RhCJuXAMxaLR.m5pai8LXJndo4ijR9MOyEW.aVm4Cvbu',
    `updatedAt` = NOW()
WHERE `email` = 'super@school.local';
