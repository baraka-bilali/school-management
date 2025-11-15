-- Script pour vérifier les indexes de performance
-- À exécuter dans phpMyAdmin pour voir si les indexes sont présents

-- Afficher tous les indexes de la table Student
SHOW INDEX FROM Student;

-- Afficher tous les indexes de la table Teacher  
SHOW INDEX FROM Teacher;

-- Si les indexes n'existent pas, utilisez le script manual-migration-indexes.sql pour les créer
