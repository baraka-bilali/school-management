-- Migration: ajouter les valeurs manquantes à l'enum NotificationType
-- Requis pour les notifications de paiement et de résiliation d'abonnement

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_PAYMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_CANCELLED';
