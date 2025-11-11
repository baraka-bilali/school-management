-- Insérer le SUPER_ADMIN directement (mot de passe = admin123)
INSERT INTO `User` (`name`, `email`, `password`, `role`, `createdAt`, `updatedAt`)
VALUES (
  'Super Admin',
  'super@school.local',
  '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m',
  'SUPER_ADMIN',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `password` = '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m',
  `role` = 'SUPER_ADMIN',
  `updatedAt` = NOW();
