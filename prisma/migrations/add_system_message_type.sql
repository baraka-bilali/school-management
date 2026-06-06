-- Migration: Ajout du type SYSTEM_MESSAGE à l'enum NotificationType
-- À exécuter dans Supabase Dashboard → SQL Editor

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM_MESSAGE';
