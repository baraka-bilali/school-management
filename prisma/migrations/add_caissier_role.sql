-- Ajouter le rôle CAISSIER pour le personnel de caisse / point de paiement
ALTER TYPE "User_role" ADD VALUE IF NOT EXISTS 'CAISSIER';
