-- Création du Super Admin initial
-- À exécuter dans Supabase → SQL Editor
-- Email : superadmin@digischool.com
-- Mot de passe : SuperAdmin@2026  (à changer après première connexion)

INSERT INTO "User" (
  "name",
  "email",
  "password",
  "role",
  "nom",
  "prenom",
  "isActive",
  "temporaryPassword",
  "createdAt",
  "updatedAt"
) VALUES (
  'Super Admin',
  'superadmin@digischool.com',
  '$2b$12$1kwirQSRg4LErMtJAXul0ecpOfWb0vopYAER8O0.oWbplnmztpdeq',
  'SUPER_ADMIN',
  'Admin',
  'Super',
  true,
  false,
  NOW(),
  NOW()
);
